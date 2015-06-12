var Chalk = require('chalk');
var Util = require('util');

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
        args.unshift( '[%d][%s] ' + arguments[0], this._curTask.id, this._curTask.name );

        _log.apply( this, args );
        return;
    }
    _log.apply( this, arguments );
};

AssetDB.success = function () {
    if ( this._curTask ) {
        var args = [].slice.call( arguments, 1 );
        args.unshift( '[%d][%s] ' + arguments[0], this._curTask.id, this._curTask.name );

        _success.apply( this, args );
        return;
    }
    _success.apply( this, arguments );
};

AssetDB.failed = function () {
    if ( this._curTask ) {
        var args = [].slice.call( arguments, 1 );
        args.unshift( '[%d][%s] ' + arguments[0], this._curTask.id, this._curTask.name );

        _failed.apply( this, args );
        return;
    }
    _failed.apply( this, arguments );
};

AssetDB.info = function () {
    if ( this._curTask ) {
        var args = [].slice.call( arguments, 1 );
        args.unshift( '[%d][%s] ' + arguments[0], this._curTask.id, this._curTask.name );

        _info.apply( this, args );
        return;
    }
    _info.apply( this, arguments );
};

AssetDB.warn = function () {
    if ( this._curTask ) {
        var args = [].slice.call( arguments, 1 );
        args.unshift( '[%d][%s] ' + arguments[0], this._curTask.id, this._curTask.name );

        _warn.apply( this, args );
        return;
    }
    _warn.apply( this, arguments );
};

AssetDB.error = function () {
    if ( this._curTask ) {
        var args = [].slice.call( arguments, 1 );
        args.unshift( '[%d][%s] ' + arguments[0], this._curTask.id, this._curTask.name );

        _error.apply( this, args );
        return;
    }
    _error.apply( this, arguments );
};
