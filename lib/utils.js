var Path = require('fire-path');
var Fs = require('fire-fs');
var Chalk = require('chalk');
var Util = require('util');
var Del = require('del');

var chalk_success = Chalk.green;
var chalk_warn = Chalk.yellow;
var chalk_error = Chalk.red;
var chalk_info = Chalk.cyan;

var AssetDB = {};
module.exports = AssetDB;

var ED = global.Editor;
var _log, _success, _failed, _info, _warn, _error;

// log
if ( ED && ED.log ) {
    _log = ED.log;
} else {
    _log = console.log;
}

// success
if ( ED && ED.log ) {
    _success = ED.success;
} else {
    _success = function () {
        var text = Util.format.apply(Util, arguments);
        console.log( chalk_success(text) );
    };
}

// failed
if ( ED && ED.log ) {
    _failed = ED.failed;
} else {
    _failed = function () {
        var text = Util.format.apply(Util, arguments);
        console.log( chalk_error(text) );
    };
}

// info
if ( ED && ED.info ) {
    _info = ED.info;
} else {
    _info = function () {
        var text = Util.format.apply(Util, arguments);
        console.info( chalk_info(text) );
    };
}

// warn
if ( ED && ED.warn ) {
    _warn = ED.warn;
} else {
    _warn = function () {
        var text = Util.format.apply(Util, arguments);

        var e = new Error('dummy');
        var lines = e.stack.split('\n');
        text = text + '\n' + lines.splice(2).join('\n');

        console.warn( chalk_warn(text) );
    };
}

// error
if ( ED && ED.error ) {
    _error = ED.error;
} else {
    _error = function () {
        var text = Util.format.apply(Util, arguments);

        var e = new Error('dummy');
        var lines = e.stack.split('\n');
        text = text + '\n' + lines.splice(2).join('\n');

        console.error( chalk_error(text) );
    };
}

if ( ED && ED.throw ) {
    AssetDB.throw = ED.throw;
}
else {
    AssetDB.throw = function ( type ) {
        var args = [].slice.call( arguments, 1 );
        var text = Util.format.apply(Util, args);
        if ( type === 'type' ) {
            throw new TypeError(text);
        }
        throw new Error(text);
    };
}

AssetDB.log = function () {
    if ( this._curTask ) {
        var args = [].slice.call( arguments, 1 );
        args.unshift( '[db-task][%s] ' + arguments[0], this._curTask.name );

        _log.apply( this, args );
        return;
    }
    _log.apply( this, arguments );
};

AssetDB.success = function () {
    if ( this._curTask ) {
        var args = [].slice.call( arguments, 1 );
        args.unshift( '[db-task][%s] ' + arguments[0], this._curTask.name );

        _success.apply( this, args );
        return;
    }
    _success.apply( this, arguments );
};

AssetDB.failed = function () {
    if ( this._curTask ) {
        var args = [].slice.call( arguments, 1 );
        args.unshift( '[db-task][%s] ' + arguments[0], this._curTask.name );

        _failed.apply( this, args );
        return;
    }
    _failed.apply( this, arguments );
};

AssetDB.info = function () {
    if ( this._curTask ) {
        var args = [].slice.call( arguments, 1 );
        args.unshift( '[db-task][%s] ' + arguments[0], this._curTask.name );

        _info.apply( this, args );
        return;
    }
    _info.apply( this, arguments );
};

AssetDB.warn = function () {
    if ( this._curTask ) {
        var args = [].slice.call( arguments, 1 );
        args.unshift( '[db-task][%s] ' + arguments[0], this._curTask.name );

        _warn.apply( this, args );
        return;
    }
    _warn.apply( this, arguments );
};

AssetDB.error = function () {
    if ( this._curTask ) {
        var args = [].slice.call( arguments, 1 );
        args.unshift( '[db-task][%s] ' + arguments[0], this._curTask.name );

        _error.apply( this, args );
        return;
    }
    _error.apply( this, arguments );
};

AssetDB.mkdirForThumbnail = function ( uuid ) {
    if ( !uuid || uuid === '' ) {
        this.throw( 'normal', 'Invalid uuid' );
    }

    // get importPath and create it if not exists
    var folder = uuid.substring(0,2);
    var dest = Path.join(this._thumbnailPath,folder);

    if ( !Fs.existsSync ( dest ) ) {
        Fs.mkdirSync(dest);
    }
    return dest;
};

AssetDB.mkdirForUuid = function ( uuid ) {
    if ( !uuid || uuid === '' ) {
        this.throw( 'normal', 'Invalid uuid' );
    }

    // get importPath and create it if not exists
    var folder = uuid.substring(0,2);
    var dest = Path.join(this._importPath,folder);

    if ( !Fs.existsSync ( dest ) ) {
        Fs.mkdirSync(dest);
    }
    return dest;
};

var _reg = /[\\/.]/;
AssetDB.copyToLibrary = function ( uuid, filename, fspath ) {
    if ( _reg.test(filename) ) {
        throw new Error( 'Invalid filename ' + filename + ', do not contains /, \\ and .');
    }

    var dest = this.mkdirForUuid(uuid);
    dest = Path.join( dest, uuid + '.' + filename );
    Fs.copySync( fspath, dest );
};

AssetDB.saveToLibrary = function ( uuid, asset ) {
    var json;
    if ( asset.serialize ) {
        json = asset.serialize();
    }
    if ( !json ) {
        json = JSON.stringify( asset, null, 2 );
    }

    var dest = this.mkdirForUuid(uuid);
    Fs.writeFileSync( Path.join(dest,uuid), json );
};

/**
 * deleteImportFile
 */
AssetDB.deleteImportFile = function ( uuid, cb ) {
    // delete library file
    var folder = uuid.substring(0,2);
    var destFolder = Path.join(this._importPath,folder);
    var dest = Path.join(destFolder,uuid);

    // delete library folder
    Del( [dest, dest + '.*'], { force: true }, function ( err, paths ) {
        if ( err ) {
            if ( cb ) cb (err);
            return;
        }

        // try to delete folder if it is empty
        Fs.rmdir(destFolder, function ( err, paths ) {
            if ( err ) {
                // skip not-empty-folder error
                // skip no such file or directory error (it is possible the dir has been delete by other)
                if ( err.code !== 'ENOTEMPTY' &&
                     err.code !== 'ENOENT' &&
                     err.code !== 'EPERM' ) {
                    if ( cb ) cb (err);
                    return;
                }
            }

            if ( cb ) cb ();
        });
    });
};

var _updateMtimeDebounceID = null;
AssetDB.updateMtime = function ( uuid ) {
    if ( uuid ) {
        var assetpath = this._uuid2path[uuid];
        if ( Fs.existsSync(assetpath) ) {
            var assetMtime = Fs.statSync(assetpath).mtime.getTime();
            var metaMtime = Fs.statSync(assetpath+'.meta').mtime.getTime();

            //
            this._uuid2mtime[uuid] = {
                asset: assetMtime,
                meta: metaMtime,
            };
        } else {
            delete this._uuid2mtime[uuid];
        }
    }

    // debounce write for 50ms
    if ( _updateMtimeDebounceID ) {
        clearTimeout(_updateMtimeDebounceID);
        _updateMtimeDebounceID = null;
    }
    _updateMtimeDebounceID = setTimeout(function () {
        var json = JSON.stringify(this._uuid2mtime, null, 2);
        // NOTE: it is possible before we wrote, library has been deleted.
        if ( Fs.existsSync( this.library ) ) {
            Fs.writeFileSync(this._uuid2mtimePath, json, 'utf8');
        }
    }.bind(this), 50);
};
