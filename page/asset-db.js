var Remote = require('remote');

var AssetDB = {};
Editor.AssetDB = AssetDB;

//
AssetDB.remote = Remote.getGlobal('AssetDB');

// ipc
AssetDB.explore = function ( url ) {
    Editor.sendToCore( 'asset-db:explore', {
        url: url
    });
};
