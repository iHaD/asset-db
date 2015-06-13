function AssetMeta () {
    this.ver = 0;
    this.uuid = '';
}

AssetMeta.prototype.serialize = function ( jsonObj ) {
    this.ver = jsonObj.ver;
    this.uuid = jsonObj.uuid;
};

AssetMeta.prototype.deserialize = function () {
    return this;
};

module.exports = AssetMeta;

