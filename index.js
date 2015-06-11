var EventEmitter = require('events');
var Util = require('util');

var Fs = require('fire-fs');
var Path = require('fire-path');
var Async = require('async');

/**
 * constructor
 */
function AssetDB ( opts ) {
    this.cwd = opts.cwd || process.cwd();

    var library = opts.library || 'library';
    this.library = Path.resolve(this.cwd, library);

    // create library directory if not exists
    if ( !Fs.existsSync(this.library) ) {
        Fs.makeTreeSync(this.library);
    }

    // init db tables
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
            AssetDB.error('Init failed, %s' + err.message);
            return;
        }
    }

    this._tasks = Async.queue(function (task, callback) {
        this.log('[Task %s] starting...', task.name);
        task.params.push(callback);
        task.run.apply( this, task.params );
    }.bind(this), 1);
}
Util.inherits(AssetDB,EventEmitter); // inherit from event emitter

var JS = require('./lib/js-utils.js');
JS.mixin( AssetDB.prototype, require('./lib/console') ); // log system
JS.mixin( AssetDB.prototype, require('./lib/interface') );

// export module
module.exports = AssetDB;

