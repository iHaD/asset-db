function AssetMeta () {
    this.ver = 0;
    this.uuid = '';
    this['meta-type'] = this.constructor['meta-type'];
}
AssetMeta['meta-type'] = 'asset';

AssetMeta.prototype.serialize = function () {
    return this;
};

AssetMeta.prototype.deserialize = function ( jsonObj ) {
    this.ver = jsonObj.ver;
    this.uuid = jsonObj.uuid;
};

AssetMeta.prototype.import = function ( assetdb, fspath, cb ) {
    var Path = require('fire-path');

    var ED = global.Editor;
    var asset;

    if ( ED && ED.assets && ED.assets.asset ) {
        asset = new ED.assets.asset();
    } else {
        asset = {};
    }
    asset.name = Path.basenameNoExt(fspath);

    assetdb.saveToLibrary( this.uuid, asset );

    if ( cb ) cb ();
};

module.exports = AssetMeta;

