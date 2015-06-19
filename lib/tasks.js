var Fs = require('fire-fs');
var Path = require('fire-path');
var Url = require('fire-url');
var Async = require('async');
var Globby = require('globby');
var _ = require('lodash');

var Tasks = {};
module.exports = Tasks;

var Meta = require('./meta');

/**
 * check and remove unused meta file
 * @param {object} assetdb - asset database
 * @param {string} fspath - meta file path
 */
function _checkIfMountValid ( assetdb, path, name ) {
    var reg = /[\\/.]/;
    if ( reg.test(name) ) {
        assetdb.throw( 'normal', 'Invalid character in %s, you can not contains `/`, `\\` or `.`', name );
    }

    if ( assetdb._mounts[name] ) {
        assetdb.throw( 'normal', 'Failed to mount %s to %s, already exists!', path, name );
    }

    for ( var p in assetdb._mounts ) {
        var mountPath = assetdb._mounts[p];
        if ( Path.contains(mountPath, path) ) {
            assetdb.throw( 'normal', 'Failed to mount %s to %s, the path or its parent %s already mounted to %s',
                       path, name, mountPath, p );
        }
        if ( Path.contains(path, mountPath) ) {
            assetdb.throw( 'normal', 'Failed to mount %s to %s, its child path %s already mounted to %s',
                       path, name, mountPath, p );
        }
    }
}

/**
 * check and remove unused meta file
 * @param {object} assetdb - asset database
 * @param {string} fspath - meta file path
 */
function _removeUnusedMeta ( assetdb, base, path ) {
    var rawpath = assetdb._assetpath(path);

    // remove .meta file if its raw data does not exist
    if ( !Fs.existsSync(rawpath) ) {
        assetdb.info( 'remove unused meta: ' + Path.relative( base, path ) );
        Fs.unlinkSync( path );
        return true;
    }

    return false;
}

/**
 * _removeUnusedImportFiles
 */
function _removeUnusedImportFiles ( assetdb, cb ) {
    // Globby
    Globby( Path.join(assetdb._importPath, '**/*'), function ( err, paths ) {
        Async.each( paths, function ( path, done ) {
            // if the file have extname, skip it
            if ( Path.extname( path ) !== '' ) {
                done();
                return;
            }

            // if this is a folder, skip it
            if ( Fs.isDirSync(path) ) {
                done();
                return;
            }

            // if we have the uuid in db, skip it
            var uuid = Path.basename(path);
            if ( assetdb._uuid2path[uuid] !== undefined ) {
                done();
                return;
            }

            //
            assetdb.log( 'remove unused import file ' + uuid );
            assetdb.deleteImportFile( uuid, function ( err ) {
                if ( err ) {
                    assetdb.failed('Failed to remove import file %s, message: %s', uuid, err.stack);
                }
                done();
            });

        }, function ( err ) {
            if ( cb ) cb (err);
        });
    });
}

/**
 * _removeUnusedMtimeInfo
 */
function _removeUnusedMtimeInfo ( assetdb, cb ) {
    var uuids = Object.keys(assetdb._uuid2mtime);
    Async.each( uuids, function ( uuid, done ) {
        var importPath = assetdb._uuid2importPath(uuid);
        if ( !Fs.existsSync(importPath) ) {
            delete assetdb._uuid2mtime[uuid];
            assetdb.log('remove unused mtime info: ' + uuid);
        }
        done();
    }, function ( err ) {
        if ( cb ) cb (err);
    });
}

/**
 * task scan
 * @param {object} assetdb - asset database
 * @param {string} fspath - file system path
 * @param {object} opts - options
 * @param {object} opts.remove-unsued-meta - indicate if remove unused meta file
 * @param {function} cb
 */
function _scan ( assetdb, fspath, opts, cb ) {
    if ( typeof opts === 'function' ) {
        cb = opts;
        opts = null;
    }

    opts = opts || {};
    if ( typeof opts['remove-unused-meta'] !== 'boolean' ) {
        opts['remove-unused-meta'] = true;
    }

    var pattern = fspath;
    if ( Fs.isDirSync( fspath ) ) {
        pattern = [pattern, Path.join(fspath,'**/*') ];
    }

    var results = [];

    // Globby
    Globby( pattern, function ( err, paths ) {
        if ( err ) {
            if (cb) cb ( err );
            return;
        }

        paths.forEach( function ( path ) {
            var extname = Path.extname(path);
            if ( extname !== '.meta' ) {
                results.push(path);
                return;
            }

            if ( opts['remove-unused-meta'] ) {
                _removeUnusedMeta( assetdb, fspath, path );
            }
        });

        if ( cb ) cb ( null, results );
    });
}

/**
 * check if reimport
 * @param {object} assetdb - asset database
 * @param {string} fspath - file system path
 * @param {function} cb
 */
function _checkIfReimport ( assetdb, fspath, cb ) {
    var uuid = assetdb._path2uuid[fspath];

    // if we don't find the meta, reimport it
    if ( !Fs.existsSync(fspath+'.meta') ) {
        if ( cb ) cb ( null, true );
        return;
    }

    // if we don't find the uuid, skip it
    if ( !uuid ) {
        if ( cb ) cb ( null, true );
        return;
    }

    // if we don't find the import file, check if this is an asset that needs to import
    var importPath = assetdb._uuid2importPath(uuid);
    if ( !Fs.existsSync(importPath) ) {
        if ( cb ) cb ( null, true );
        return;
    }

    // if import file exists, check the rawdata's mtime
    var mtimeInfo = assetdb._uuid2mtime[uuid];
    if ( mtimeInfo ) {
        var assetStat = Fs.statSync(fspath);
        if ( mtimeInfo.asset !== assetStat.mtime.getTime() ) {
            if ( cb ) cb ( null, true );
            return;
        }

        var metaStat = Fs.statSync(fspath + '.meta');
        if ( mtimeInfo.meta !== metaStat.mtime.getTime() ) {
            if ( cb ) cb ( null, true );
            return;
        }

        // no need for reimport
        if ( cb ) cb ( null, false );
        return;
    }

    // reimport anyway
    if ( cb ) cb ( null, true );
}

/**
 * precache uuid from meta files, if meta file not exists, create it
 * @param {object} assetdb - asset database
 * @param {string} fspath - file system path
 * @param {function} cb
 */
function _initMetas ( assetdb, fspath, cb ) {
    var pattern = fspath;
    if ( Fs.isDirSync( fspath ) ) {
        pattern = Path.join(fspath,'**/*');
        if ( !assetdb._isroot(fspath) ) {
            pattern = [fspath, pattern];
        }
    }

    var results = [];

    // Globby
    Globby( pattern, function ( err, paths ) {
        if ( err ) {
            if (cb) cb ( err );
            return;
        }

        paths.forEach( function ( path ) {
            var extname = Path.extname(path);
            var metaObj;

            var metapath = path;

            // if assetdb is a raw file, check check if meta exists and skip it
            if ( extname !== '.meta' ) {
                // if meta not exists, create and save it
                metapath = path+'.meta';
                if ( !Fs.existsSync(metapath) ) {
                    metaObj = Meta.create( assetdb, metapath );
                    Meta.save( assetdb, metapath, metaObj );
                    results.push({
                        assetpath: path,
                        meta: metaObj,
                    });
                }

                return;
            }

            // remove unused meta
            var removed = _removeUnusedMeta( assetdb, fspath, path );
            if ( removed ) {
                return;
            }

            // try to load the meta
            var basename = Path.basename(metapath,'.meta');
            metaObj = Meta.load( assetdb, metapath );
            if ( metaObj ) {
                results.push({
                    assetpath: assetdb._assetpath(metapath),
                    meta: metaObj,
                });
            }
        });

        if ( cb ) cb ( null, results );
    });
}

/**
 * task refresh
 */
function _refresh ( assetdb, fspath, cb ) {
    Async.waterfall([
        // scan and collect all assets
        function ( next ) {
            assetdb.log( 'scan %s...', fspath);
            _scan( assetdb, fspath, {
                'remove-unused-meta': true
            }, next );
        },

        // check if re-import
        function ( paths, next ) {
            assetdb.log( 'check if reimport...');
            var results = [];
            Async.each( paths, function ( path, done ) {
                _checkIfReimport( assetdb, path, function ( err, needsImport ) {
                    if ( err ) {
                        assetdb.failed('failed to check-if-reimport for %s, message: %s',
                                       Path.relative( fspath, path ),
                                       err.stack);
                        done();
                        return;
                    }

                    if ( needsImport ) {
                        results.push(path);
                    }
                    done();
                });
            }, function ( err ) {
                next ( err, results );
            } );
        },

        // reimport assets
        function ( paths, next ) {
            assetdb.log( 'reimport assets...');
            Async.each( paths, function ( path, done ) {
                _importAsset( assetdb, path, function ( err, uuid ) {
                    if ( err ) {
                        assetdb.failed('Failed to import asset %s, message: %s',
                                       path,
                                       err.stack);
                        done();
                        return;
                    }
                    assetdb.updateMtime(uuid);

                    done();
                });
            }, function ( err ) {
                next ( err );
            } );
        },

    ], function ( err ) {
        if ( err ) throw err;
        if ( cb ) cb ();
    });
}

/**
 * precache uuid from meta files, if meta file not exists, create it
 * @param {object} assetdb - asset database
 * @param {string} fspath - file system path
 * @param {function} cb
 */
function _importAsset ( assetdb, fspath, cb ) {
    var metapath = fspath + '.meta';
    var meta = Meta.load( assetdb, metapath );
    if ( !meta ) {
        meta = Meta.create( assetdb, metapath );
        // if we still get null, report error
        if ( !meta ) {
            if ( cb ) cb ( new Error('Can not create or load meta from %s', fspath) );
            return;
        }
    }

    // skip folder meta
    if ( meta.import ) {
        try {
            assetdb.log( 'import asset %s...', fspath);
            meta.import ( assetdb, fspath, function ( err ) {
                if ( err ) {
                    if ( cb ) cb ( err );
                    return;
                }
                if ( cb ) cb ( null, meta.uuid );
            });
        } catch ( err ) {
            if ( cb ) cb (err);
        }
        return;
    }

    if ( cb ) cb ();
}

// task mount
Tasks.mount = function ( assetdb, path, name, cb ) {
    if ( typeof path !== 'string' ) {
        assetdb.throw( 'type', 'expect 1st param to be a string' );
    }

    if ( !Fs.isDirSync(path) ) {
        assetdb.throw( 'normal', 'Failed to mount %s, path not found or it is not a directory!', path );
    }

    if ( typeof name !== 'string' ) {
        assetdb.throw( 'type', 'expect 2nd param to be a string' );
    }

    _checkIfMountValid(assetdb, path, name);

    // add mounting path
    assetdb._mounts[name] = path;

    if ( cb ) cb ();
};

// task unmount
Tasks.unmount = function ( assetdb, name, cb ) {
    // type check
    if ( typeof name !== 'string' ) {
        assetdb.throw( 'type', 'expect 1st param to be a string' );
    }

    // check if mounts exists
    if ( !assetdb._mounts[name] ) {
        assetdb.throw( 'normal', 'can not find the mount %s', name );
    }

    // TODO: remove import files relate with the mounts

    delete assetdb._mounts[name];

    if ( cb ) cb ();
};

// task init
// init asset db after setup mounts
Tasks.init = function ( assetdb, cb ) {
    var mountNames = Object.keys(assetdb._mounts);

    Async.series([
        // init meta files
        function ( next ) {
            Async.eachSeries( mountNames, function ( name, done ) {
                var fspath = assetdb._mounts[name];
                assetdb.log('init meta files at %s://', name);
                _initMetas(assetdb, fspath, function ( err, results ) {
                    results.forEach(function ( result ) {
                        assetdb._dbAdd(result.assetpath,
                                       result.meta.uuid);
                    });
                    done();
                });
            }, next );
        },

        // refresh
        function ( next ) {
            Async.eachSeries( mountNames, function ( name, done ) {
                var fspath = assetdb._mounts[name];
                assetdb.log('refresh at %s://', name);
                _refresh( assetdb, fspath, done );
            }, next );
        },

        // remove unsued import files
        function ( next ) {
            _removeUnusedImportFiles ( assetdb, function ( err ) {
                if ( err ) {
                    assetdb.failed( 'Failed to remove unused import files, message: %s', err.stack );
                }
                next();
            });
        },

        // remove unused mtime info
        function (next) {
            _removeUnusedMtimeInfo ( assetdb, function ( err ) {
                if ( err ) {
                    assetdb.failed( 'Failed to remove unused mtime info, message: %s', err.stack );
                }
                assetdb.updateMtime();
                next ();
            });
        },

    ], function ( err ) {
        if ( err ) throw err;
        if ( cb ) cb ();
    });
};

// task refresh
Tasks.refresh = function ( assetdb, path, cb ) {
    Async.series([
        // init meta
        function ( next ) {
            _initMetas( assetdb, path, next );
        },

        // refresh
        function ( next ) {
            _refresh( assetdb, path, next );
        },
    ], function ( err ) {
        if ( err ) throw err;
        if ( cb ) cb ();
    });
};

// task deep query
Tasks.deepQuery = function ( assetdb, cb ) {
    var mountNames = Object.keys(assetdb._mounts);
    var results = [];

    Async.eachSeries( mountNames, function ( name, done ) {
        var fspath = assetdb._mounts[name];
        var info = {
            name: name,
            id: name,
            type: 'mount',
            children: [],
        };
        results.push(info);

        var path2info = {};
        path2info[fspath] = info;

        Globby( Path.join(fspath, '**/*.meta'), function ( err, paths ) {
            paths.forEach( function ( metapath ) {
                var assetpath = assetdb._assetpath(metapath);
                info = {
                    name: Path.basenameNoExt(assetpath),
                    id: assetdb._path2uuid[assetpath],
                    type: Meta.findCtor(assetdb,assetpath).prototype.constructor.name,
                    children: [],
                };
                path2info[assetpath] = info;

                var parentInfo = path2info[Path.dirname(assetpath)];
                parentInfo.children.push(info);
            });
            done ();
        });
    }, function ( err ) {
        if ( err ) throw err;
        if ( cb ) cb ( results );
    });
};

// for unit-test
Tasks._scan = _scan;
Tasks._checkIfReimport = _checkIfReimport;
Tasks._initMetas = _initMetas;
Tasks._refresh = _refresh;
Tasks._importAsset = _importAsset;
