function AssetMeta () {
    this.ver = 0;
    this.uuid = '';
}

AssetMeta.prototype.serialize = function () {
    return this;
};

AssetMeta.prototype.deserialize = function ( jsonObj ) {
    this.ver = jsonObj.ver;
    this.uuid = jsonObj.uuid;
};

AssetMeta.prototype.import = function ( assetdb, fspath, cb ) {
    var Path = require('fire-path');

    var asset = {
        _name: Path.basenameNoExt(fspath)
    };
    assetdb.saveToLibrary( this.uuid, asset );

    if ( cb ) cb ();
};

module.exports = AssetMeta;

