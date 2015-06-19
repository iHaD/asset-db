Editor.assetdb = (function () {
    var AssetDB = {};

    //
    AssetDB.remote = Editor.remote.assetdb;
    AssetDB.library = AssetDB.remote.library;

    // ipc

    AssetDB.explore = function ( url ) {
        Editor.sendToCore( 'asset-db:explore', {
            url: url
        });
    };

    AssetDB.deepQuery = function ( cb ) {
        Editor.sendRequestToCore( 'asset-db:deep-query', cb );
    };

    return AssetDB;
})();
