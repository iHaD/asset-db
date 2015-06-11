var Chalk = require('chalk');
var Util = require('util');

var chalk_success = Chalk.green;
var chalk_warn = Chalk.yellow;
var chalk_error = Chalk.red;
var chalk_info = Chalk.cyan;

var AssetDB = {};
module.exports = AssetDB;

var ED = global.Editor;

// log
if ( ED && ED.log ) {
    AssetDB.log = ED.log;
} else {
    AssetDB.log = console.log;
}

// success
if ( ED && ED.log ) {
    AssetDB.success = ED.success;
} else {
    AssetDB.success = function () {
        var text = Util.format.apply(Util, arguments);
        console.log( chalk_success(text) );
    };
}

// failed
if ( ED && ED.log ) {
    AssetDB.success = ED.success;
} else {
    AssetDB.success = function () {
        var text = Util.format.apply(Util, arguments);
        console.log( chalk_error(text) );
    };
}

// info
if ( ED && ED.info ) {
    AssetDB.info = ED.info;
} else {
    AssetDB.info = function () {
        var text = Util.format.apply(Util, arguments);
        console.info( chalk_info(text) );
    };
}

// warn
if ( ED && ED.warn ) {
    AssetDB.warn = ED.warn;
} else {
    AssetDB.warn = function () {
        var text = Util.format.apply(Util, arguments);

        var e = new Error('dummy');
        var lines = e.stack.split('\n');
        text = text + '\n' + lines.splice(2).join('\n');

        console.warn( chalk_warn(text) );
    };
}

// error
if ( ED && ED.warn ) {
    AssetDB.warn = ED.warn;
} else {
    AssetDB.warn = function () {
        var text = Util.format.apply(Util, arguments);

        var e = new Error('dummy');
        var lines = e.stack.split('\n');
        text = text + '\n' + lines.splice(2).join('\n');

        console.error( chalk_error(text) );
    };
}
