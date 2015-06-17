var EventEmitter = require('events');
var Util = require('util');

var Fs = require('fire-fs');
var Path = require('fire-path');
var Async = require('async');

function _shortString ( str, cnt ) {
    if ( cnt <= 3 || str.length <= cnt )
        return str;

    var part = Math.floor(cnt/2);
    if ( str.length > cnt && str.length < cnt + 3 ) {
        return str.substr( 0, part ) + '...' + str.substr( str.length - part + (str.length - cnt + 3) );
    }
    return str.substr( 0, part ) + '...' + str.substr( str.length - part );
}

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

    // init meta info
    this._extname2infos = {};

    // init imports folder
    this._importPath = Path.join( this.library, 'imports' );
    if ( !Fs.existsSync(this._importPath) ) {
        Fs.mkdirSync(this._importPath);
    }

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

    // task runner
    this._genTaskID = -1;
    this._curTask = null;
    this._tasks = Async.queue(function (task, callback) {
        var taskNameWithParams = task.name + ' ';
        for ( var i = 0; i < task.params.length; ++i ) {
            taskNameWithParams += _shortString(task.params[i], 20);
            if ( i !== task.params.length-1 ) {
                taskNameWithParams += ', ';
            }
        }

        // push finish callback
        var done = function ( err ) {
            this.success('done!');
            this._curTask = null;
            callback.apply( null, arguments );
        }.bind(this);
        task.params.unshift(this);
        task.params.push(done);
        task.id = ++this._genTaskID % 100;

        // run the task
        try {
            this.log('[db-task][%s] running...', taskNameWithParams);
            this._curTask = task;
            task.run.apply( this, task.params );
        } catch ( err ) {
            this.failed('failed!');
            this._curTask = null;
            callback(err);
        }
    }.bind(this), 1);
}

var JS = require('./lib/js-utils.js');
JS.extend(AssetDB,EventEmitter); // inherit from event emitter

JS.mixin( AssetDB.prototype, require('./lib/utils') );
JS.mixin( AssetDB.prototype, require('./lib/interface') );
JS.mixin( AssetDB.prototype, require('./lib/internal') );

// export module
module.exports = AssetDB;

