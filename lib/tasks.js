var Fs = require('fire-fs');
var Path = require('fire-path');
var Url = require('fire-url');
var Async = require('async');
var Globby = require('globby');
var _ = require('lodash');

var Tasks = {};
module.exports = Tasks;

function _checkIfMountValid ( path, name ) {
    var reg = /[\\/.]/;
    if ( reg.test(name) ) {
        this.throw( 'normal', 'Invalid character in %s, you can not contains `/`, `\\` or `.`', name );
    }

    if ( this._mounts[name] ) {
        this.throw( 'normal', 'Failed to mount %s to %s, already exists!', path, name );
    }

    for ( var p in this._mounts ) {
        var mountPath = this._mounts[p];
        if ( Path.contains(mountPath, path) ) {
            this.throw( 'normal', 'Failed to mount %s to %s, the path or its parent %s already mounted to %s',
                       path, name, mountPath, p );
        }
        if ( Path.contains(path, mountPath) ) {
            this.throw( 'normal', 'Failed to mount %s to %s, its child path %s already mounted to %s',
                       path, name, mountPath, p );
        }
    }
}

/**
 * check and remove unused meta file
 * @param {string} fspath - meta file path
 */
function _removeUnusedMeta ( base, path ) {
    var rawpath = this._rawpath(path);

    // remove .meta file if its raw data does not exist
    if ( !Fs.existsSync(rawpath) ) {
        this.info( 'remove unused meta: ' + Path.relative( base, path ) );
        Fs.unlinkSync( path );
        return true;
    }

    return false;
}

/**
 * task scan
 * @param {string} fspath - file system path
 * @param {object} opts - options
 * @param {object} opts.remove-unsued-meta - indicate if remove unused meta file
 * @param {function} cb
 */
function _scan ( fspath, opts, cb ) {
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
    var assetdb = this;

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
                _removeUnusedMeta.call( assetdb, fspath, path );
            }
        });

        if ( cb ) cb ( null, results );
    });
}

/**
 * check if reimport
 * @param {string} fspath - file system path
 * @param {function} cb
 */
function _checkIfReimport ( fspath, cb ) {
    // TODO:
    if ( cb ) cb ( null, true );
}

/**
 * precache uuid from meta files, if meta file not exists, create it
 * @param {string} fspath - file system path
 * @param {boolean} isroot - if this is root path, no need to generate meta for root path
 * @param {function} cb
 */
function _initMetas ( fspath, isroot, cb ) {
    var pattern = fspath;
    if ( Fs.isDirSync( fspath ) ) {
        pattern = Path.join(fspath,'**/*');
        if ( !isroot ) {
            pattern = [fspath, pattern];
        }
    }

    var results = [];
    var assetdb = this;

    // Globby
    Globby( pattern, function ( err, paths ) {
        if ( err ) {
            if (cb) cb ( err );
            return;
        }

        paths.forEach( function ( path ) {
            var extname = Path.extname(path);
            var metaObj;

            // if this is a raw file, check check if meta exists and skip it
            if ( extname !== '.meta' ) {
                // if meta not exists, create and save it
                if ( !Fs.existsSync( path + '.meta') ) {
                    metaObj = Meta.create(path);
                    Meta.save( path, metaObj );
                    results.push({
                        path: path,
                        meta: metaObj,
                    });
                }

                return;
            }

            // remove unused meta
            var removed = _removeUnusedMeta.call( assetdb, fspath, path );
            if ( removed ) {
                return;
            }

            // try to load the meta
            try {
                var basename = Path.basename(path,'.meta');
                metaObj = Meta.load(path);
                results.push({
                    path: path,
                    meta: metaObj,
                });
            } catch ( err ) {
                assetdb.failed( 'Failed to load meta %s. Message: %s', path, err.message );

                // NOTE: I don't recreate the meta here.
                // This means if a meta file loads failed,
                // it will not add into db and user needs to solve this manually.
            }
        });
    });

    if ( cb ) cb ( null, results );
}

// task mount
Tasks.mount = function ( path, name, cb ) {
    if ( typeof path !== 'string' ) {
        this.throw( 'type', 'expect 1st param to be a string' );
    }

    if ( !Fs.isDirSync(path) ) {
        this.throw( 'normal', 'Failed to mount %s, path not found or it is not a directory!', path );
    }

    if ( typeof name !== 'string' ) {
        this.throw( 'type', 'expect 2nd param to be a string' );
    }

    _checkIfMountValid.call(this, path, name);

    // add mounting path
    this._mounts[name] = path;

    if ( cb ) cb ();
};

// task unmount
Tasks.unmount = function ( name, cb ) {
    // type check
    if ( typeof name !== 'string' ) {
        this.throw( 'type', 'expect 1st param to be a string' );
    }

    // check if mounts exists
    if ( !this._mounts[name] ) {
        this.throw( 'normal', 'can not find the mount %s', name );
    }

    // TODO: remove library files relate with the mounts

    delete this._mounts[name];

    if ( cb ) cb ();
};

// task init
// init asset db after setup mounts
Tasks.init = function ( cb ) {
    var mountNames = Object.keys(this._mounts);
    var assetdb = this;

    Async.series([
        // init meta files
        function ( next ) {
            Async.eachSeries( mountNames, function ( name, done ) {
                var fspath = mountNames[name];
                _initMetas.call(assetdb, fspath, true, function ( err, results ) {
                    results.forEach(function ( result ) {
                        assetdb._dbAdd(assetdb._rawpath(result.path),
                                       result.meta.uuid);
                    });
                    done();
                });
            }, next );
        },

        // refresh
        function ( next ) {
            Async.eachSeries( mountNames, function ( name, done ) {
                var fspath = mountNames[name];
                Tasks.refresh.call( assetdb, fspath, done );
            }, next );
        },

        // remove unsued library files
        function ( next ) {
            // TODO
            next ();
        },

        // remove unused mtime info
        function (next) {
            // TODO
            next ();
        },

    ], function ( err ) {
        if ( cb ) cb (err);
    });
};

// task refresh
Tasks.refresh = function ( fspath, cb ) {
    Async.waterfall([
        // scan and collect all assets
        function ( next ) {
            _scan.call( this, fspath, next );
        },

        // check if re-import
        function ( paths, next ) {
            var results = [];
            Async.each( paths, function ( path, done ) {
                _checkIfReimport( path, function ( err, needsImport ) {
                    if ( err ) {
                        this.failed('failed to check-if-reimport for %s, message: %s',
                                    Path.relative( fspath, path ),
                                    err.message);
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
    ], function ( err ) {
        if ( cb ) cb (err);
    });
};

// for unit-test
Tasks._scan = _scan;
Tasks._checkIfReimport = _checkIfReimport;
Tasks._initMetas = _initMetas;
