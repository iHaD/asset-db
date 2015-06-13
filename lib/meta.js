var Path = require('fire-path');
var Fs = require('fire-fs');
var Uuid = require('node-uuid');
var Minimatch = require('minimatch');

var JS = require('./js-utils');
var AssetMeta = require('./meta/asset');
var FolderMeta = require('./meta/folder');

var Meta = {
    _assetMeta: AssetMeta,
    _folderMeta: FolderMeta,
    _extname2infos: {},
};
module.exports = Meta;

/**
 * create meta
 */
Meta.create = function ( fspath, uuid ) {
    var ctor = Meta.findCtor(fspath);

    if ( !uuid ) {
        uuid = Uuid.v4();
    }
    var meta = new ctor();
    meta.uuid = uuid;

    return meta;
};

/**
 * get the ctor
 * @param {string} fs-path
 */
Meta.findCtor = function ( fspath ) {
    var extname = Path.extname(fspath);
    var isFolder = Fs.isDirSync(fspath);
    var infos = this._extname2infos[extname];

    // pattern match process
    if ( infos ) {
        for ( var i = 0; i < infos.length; ++i ) {
            var info = infos[i];
            var skip = (isFolder && !info.folder) || (!isFolder && info.folder);

            if ( !skip ) {
                if ( info.pattern ) {
                    if ( Minimatch( fspath, info.pattern ) ) {
                        return info.ctor;
                    }
                } else {
                    return info.ctor;
                }
            }
        }
    }

    // default process
    if ( isFolder ) {
        return this._folderMeta;
    }
    return this._assetMeta;
};

/**
 * the latest register, will be first match
 */
Meta.register = function ( extname, pattern, folder, metaCtor ) {
    if ( !JS.isChildClassOf(metaCtor, AssetMeta) ) {
        this.warn( "Failed to register meta to %s, the metaCtor is not extended from AssetMeta", extname );
        return;
    }

    if ( typeof extname !== 'string' || extname[0] !== '.' ) {
        this.warn( 'Invalid extname %s, must be string and must in the format ".foo"', extname );
        return;
    }

    if ( !this._extname2infos[extname] ) {
        this._extname2infos[extname] = [];
    }
    this._extname2infos[extname].unshift({
        pattern: pattern,
        folder: folder,
        ctor: metaCtor
    });
};

/**
 * reset
 */
Meta.reset = function () {
    this._extname2infos = {};
};

/**
 * load
 */
Meta.load = function ( fspath ) {
    // TODO: register serializer for it
    // TODO: use try catch here, if serialize type not found, try to resolve it to keep the uuid.
    return JSON.parse(Fs.readFileSync(path));
};

/**
 * save
 */
Meta.save = function ( fspath, obj ) {
    // TODO: register serializer for it
    Fs.writeFileSync( fspath, JSON.stringify(obj, null, 2));
};
