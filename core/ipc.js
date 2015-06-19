var Ipc = require('ipc');
var Shell = require('shell');

// asset-db:explore
Ipc.on ( 'asset-db:explore', function ( url ) {
    var fspath = Editor.assetdb._fspath(url);
    Shell.showItemInFolder(fspath);
});

// asset-db:deep-query
Ipc.on ( 'asset-db:deep-query', function ( reply ) {
    Editor.assetdb.deepQuery( reply );
});
