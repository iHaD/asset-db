var EventEmitter = require('events');
var Util = require('util');

var Fs = require('fire-fs');
var Path = require('fire-path');
var Url = require('fire-url');

var Async = require('async');
var Del = require('del');

var JS = require('./js-utils');

function AssetDB ( opts ) {
    this.cwd = opts.cwd || process.cwd;

    var library = opts.library || 'library';
    this.library = Path.resolve(this.cwd, library);

    this._mounts = {};
    this._uuid2mtime = {};
    this._uuid2path = {};
    this._path2uuid = {};
    this._path2subuuids = {};

    // load uuid-to-mtime table
    this._uuid2mtimePath = Path.join( this.library, 'uuid-to-mtime.json' );
    try {
        this._uuid2mtime = JSON.parse(Fs.readFileSync(this._uuid2mtimePath));
    }
    catch ( err ) {
        if ( err.code !== 'ENOENT' ) {
            Editor.error('Init failed, %s' + err.message);
            return;
        }
    }

    //
    this.dbType = opts['db-type'] || 'simple';
    if ( this.dbType === 'simple' ) {
        JS.mixin( this, require('./simple') );
    }
}
Util.inherits(AssetDB,EventEmitter);

AssetDB.prototype.mount = function ( path, name ) {
    if ( this._mounts[name] ) {
        Editor.warn( 'Failed to mount %s to %s, already exists!', path, name );
        return;
    }
    this._mounts[name] = path;

    // TODO: add to tasks
    Editor.success( 'Mount %s to %s://', path, name );
};

AssetDB.prototype.unmount = function ( path ) {
};

AssetDB.prototype.commit = function () {
};

module.exports.init = function( opts ) {
    return new AssetDB(opts);
};
