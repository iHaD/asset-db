var Path = require('fire-path');
var Fs = require('fire-fs');
var Uuid = require('node-uuid');
var Minimatch = require('minimatch');

var JS = require('./js-utils');

var Meta = {
    AssetMeta: require('./meta/asset'),
    FolderMeta: require('./meta/folder'),
};
module.exports = Meta;

/**
 * create meta
 */
Meta.create = function ( assetdb, fspath, uuid ) {
    var ctor = Meta.findCtor( assetdb, fspath );

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
Meta.findCtor = function ( assetdb, fspath ) {
    var extname = Path.extname(fspath);
    var isFolder = Fs.isDirSync(fspath);
    var infos = assetdb._extname2infos[extname];

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
        return Meta.FolderMeta;
    }
    return Meta.AssetMeta;
};

/**
 * the latest register, will be first match
 */
Meta.register = function ( assetdb, extname, pattern, folder, metaCtor ) {
    if ( !JS.isChildClassOf(metaCtor, Meta.AssetMeta) ) {
        assetdb.warn( "Failed to register meta to %s, the metaCtor is not extended from AssetMeta", extname );
        return;
    }

    if ( typeof extname !== 'string' || extname[0] !== '.' ) {
        assetdb.warn( 'Invalid extname %s, must be string and must in the format ".foo"', extname );
        return;
    }

    if ( !assetdb._extname2infos[extname] ) {
        assetdb._extname2infos[extname] = [];
    }
    assetdb._extname2infos[extname].unshift({
        pattern: pattern,
        folder: folder,
        ctor: metaCtor
    });
};

/**
 * reset
 */
Meta.reset = function (assetdb) {
    assetdb._extname2infos = {};
};

/**
 * load
 */
Meta.load = function ( assetdb, fspath ) {
    if ( !Fs.existsSync(fspath) )
        return null;

    var jsonObj;
    try {
        jsonObj = JSON.parse(Fs.readFileSync(fspath));
    } catch ( err ) {
        assetdb.failed( 'Failed to load meta %s, message: %s', fspath, err.message );
        return null;
    }

    //
    var meta = Meta.create( assetdb, fspath, jsonObj.uuid );
    meta.deserialize(jsonObj);
    return meta;
};

/**
 * save
 */
Meta.save = function ( assetdb, fspath, meta ) {
    var obj = meta.serialize();
    Fs.writeFileSync(fspath, JSON.stringify(obj, null, 2));
};

/**
 * get meta file's version number
 */
Meta.loadVer = function ( assetdb, fspath ) {
    if ( !Fs.existsSync(fspath) )
        return -1;

    var jsonObj;
    try {
        jsonObj = JSON.parse(Fs.readFileSync(fspath));
    } catch ( err ) {
        assetdb.failed( 'Failed to load meta %s, message: %s', fspath, err.message );
        return -1;
    }

    if ( typeof jsonObj.ver === 'number' )
        return jsonObj.ver;

    return -1;
};
