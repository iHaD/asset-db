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
Meta.create = function ( assetdb, metapath, uuid ) {
    if ( Path.extname(metapath) !== '.meta' ) {
        assetdb.error( 'Invalid metapath, must use .meta as suffix' );
        return null;
    }

    var ctor = Meta.findCtor( assetdb, assetdb._assetpath(metapath) );
    if ( !ctor ) {
        return null;
    }

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
Meta.findCtor = function ( assetdb, assetpath ) {
    if ( Path.extname(assetpath) === '.meta' ) {
        assetdb.error( 'Invalid assetpath, must not use .meta as suffix' );
        return null;
    }

    var extname = Path.extname(assetpath);
    var isFolder = Fs.isDirSync(assetpath);
    var infos = assetdb._extname2infos[extname];

    // pattern match process
    if ( infos ) {
        for ( var i = 0; i < infos.length; ++i ) {
            var info = infos[i];
            var skip = (isFolder && !info.folder) || (!isFolder && info.folder);

            if ( !skip ) {
                var metaCtor = info.ctor;
                if ( metaCtor.validate ) {
                    if ( metaCtor.validate(assetpath) ) {
                        return metaCtor;
                    }
                }
                else {
                    return metaCtor;
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
Meta.register = function ( assetdb, extname, folder, metaCtor ) {
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
        folder: folder,
        ctor: metaCtor
    });
};

/**
 * the latest register, will be first match
 */
Meta.unregister = function ( assetdb, metaCtor ) {
    for ( var p in assetdb._extname2infos ) {
        if ( assetdb._extname2infos[p].ctor === metaCtor ) {
            delete assetdb._extname2infos[p];
        }
    }
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
Meta.load = function ( assetdb, metapath ) {
    if ( Path.extname(metapath) !== '.meta' ) {
        assetdb.error( 'Invalid metapath, must use .meta as suffix' );
        return null;
    }

    if ( !Fs.existsSync(metapath) ) {
        return null;
    }

    var jsonObj;
    try {
        jsonObj = JSON.parse(Fs.readFileSync(metapath));
    } catch ( err ) {
        assetdb.failed( 'Failed to load meta %s, message: %s', metapath, err.message );
        return null;
    }

    //
    var meta = Meta.create( assetdb, metapath, jsonObj.uuid );
    if ( !meta ) {
        return null;
    }

    meta.deserialize(jsonObj);
    return meta;
};

/**
 * save
 */
Meta.save = function ( assetdb, metapath, meta ) {
    if ( Path.extname(metapath) !== '.meta' ) {
        assetdb.error( 'Invalid metapath, must use .meta as suffix' );
        return null;
    }

    var obj = meta.serialize();
    Fs.writeFileSync(metapath, JSON.stringify(obj, null, 2));
};

/**
 * get meta file's version number
 */
Meta.loadVer = function ( assetdb, metapath ) {
    if ( Path.extname(metapath) !== '.meta' ) {
        assetdb.error( 'Invalid metapath, must use .meta as suffix' );
        return -1;
    }

    if ( !Fs.existsSync(metapath) ) {
        return -1;
    }

    var jsonObj;
    try {
        jsonObj = JSON.parse(Fs.readFileSync(metapath));
    } catch ( err ) {
        assetdb.failed( 'Failed to load meta %s, message: %s', metapath, err.message );
        return -1;
    }

    if ( typeof jsonObj.ver === 'number' )
        return jsonObj.ver;

    return -1;
};
