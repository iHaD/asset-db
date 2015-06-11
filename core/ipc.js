var AssetDB = require('../index');
var Ipc = require('ipc');
var Shell = require('shell');

// asset-db
Ipc.on ( 'asset-db:explore', function ( url ) {
    var fspath = AssetDB.fspath(url);
    Shell.showItemInFolder(fspath);
} );
