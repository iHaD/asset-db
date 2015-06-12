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

// task scan
_scan = function ( fspath, opts, cb ) {
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

        var removeUnusedMeta = opts['remove-unused-meta'];
        paths.forEach( function ( path ) {
            var extname = Path.extname(path);
            if ( extname !== '.meta' ) {
                // NOTE: we don't allow file asset with empty extname.
                // it will lead to conflicts of .meta file when folder
                // and empty-ext-file using the same name.
                if ( extname === '.' || (Fs.isDirSync(path) === false && extname === '') ) {
                    // assetdb.warn( 'empty extname asset is not allowed: ' + file.relative );
                    return;
                }

                results.push(path);
                return;
            }

            if ( removeUnusedMeta ) {
                var basename = Path.basename(path,'.meta');
                var rawpath = Path.join(Path.dirname(path),basename);

                // remove .meta file if its raw data does not exist
                if ( !Fs.existsSync(rawpath) ) {
                    assetdb.info( 'remove unused meta: ' + Path.relative( fspath, path ) );
                    Fs.unlinkSync( path );
                }
            }
        });

        if ( cb ) cb ( null, results );
    });
};

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

    // refresh files in path to library
    Tasks.refresh.call( this, path, cb );
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

// task refresh
Tasks.refresh = function ( fspath, cb ) {
    Async.waterfall([
        function ( next ) {
            _scan.call( this, fspath, next );
        },
    ], function ( err ) {
        if ( cb ) cb (err);
    });
};

// for unit-test
Tasks._scan = _scan;
