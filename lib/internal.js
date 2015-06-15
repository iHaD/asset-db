var Path = require('fire-path');
var Url = require('fire-url');

module.exports = {
    /**
     * make a dbpath
     * @param {string} name - the mounting name
     * @param {string} * - any other params
     * @return {string} - the dbpath
     */
    _dbpath: function ( name ) {
        var args = [].slice.call( arguments, 1 );
        var path = Url.join.apply( Url, args);

        // trim the slashes in at first
        for ( var i = 0; i < path.length; ++i ) {
            if ( path[i] !== '/' ) {
                break;
            }
        }
        path = path.substr(i);

        return Url.format({
            protocol: name,
            host: path,
            slashes: true,
        });
    },

    /**
     * convert a dbpath to fspath
     * @param {string} url - the url path
     * @return {string} - the absolute file system path
     */
    _fspath: function ( url ) {
        if ( !url ) {
            return null;
        }

        var list = url.split(':');
        if ( list.length !== 2 ) {
            return null;
        }

        var name = list[0];
        var relpath = Path.normalize(list[1]);
        if ( !this._mounts[name] ) {
            return null;
        }

        return Path.resolve( Path.join(this._mounts[name], relpath) );
    },

    // from meta-path to rawdata-path
    _rawpath: function ( metapath ) {
        var basename = Path.basename(metapath,'.meta');
        return Path.join(Path.dirname(metapath),basename);
    },

    _isroot: function ( fspath ) {
        var path = Path.resolve(fspath);
        for ( var p in this._mounts ) {
            if ( this._mounts[p] === fspath )
                return true;
        }
        return false;
    },

    // convert uuid to library-path
    _uuid2libpath: function ( uuid ) {
        return Path.join( this.library, uuid.substring(0,2), uuid );
    },

    _fspath2libpath: function ( fspath ) {
        var uuid = this._path2uuid(fspath);
        if ( uuid ) {
            return this._uuid2libpath(uuid);
        }
        return null;
    },

    /**
     * @param {string} fspath - fs-path
     * @param {string} uuid - uuid
     */
    _dbAdd: function ( fspath, uuid ) {
        if ( this._uuid2path[uuid] ) {
            this.failed( 'uuid collision, uuid = %s, collision = %s, path = %s', uuid, this._uuid2path[uuid], fspath );
        }

        if ( this._path2uuid[fspath] ) {
            this.failed( 'path collision, path = %s, collision = %s, uuid = %s', fspath, this._path2uuid[fspath], uuid );
        }

        this._path2uuid[fspath] = uuid;
        this._uuid2path[uuid] = fspath;
    },

    // TODO:
    // _dbMove: function ( srcpath, destpath ) {
    //     var uuid = this._pathToUuid[srcpath];

    //     delete this._pathToUuid[srcpath];

    //     this._pathToUuid[destpath] = uuid;
    //     this._uuidToPath[uuid] = destpath;

    //     //
    //     var subUuids = this._pathToSubUuids[srcpath];
    //     if ( subUuids ) {
    //         // for ( var i = 0; i < subUuids.length; ++i ) {
    //         //     var subUuid = subUuids[i];
    //         //     var subPath = this._uuidToPath[subUuid];

    //         //     delete this._pathToUuid[subPath];
    //         //     var destSubPath = Path.join( destpath, Path.basename(subPath) );

    //         //     this._pathToUuid[destSubPath] = subUuid;
    //         //     this._uuidToPath[subUuid] = destSubPath;
    //         // }
    //         delete this._pathToSubUuids[srcpath];
    //         this._pathToSubUuids[destpath] = subUuids;
    //     }
    // },

    // _dbDelete: function ( fspath, includeSubAssets ) {
    //     var uuid = this._pathToUuid[fspath];
    //     delete this._pathToUuid[fspath];
    //     delete this._uuidToPath[uuid];

    //     //
    //     if ( includeSubAssets ) {
    //         var subUuids = this._pathToSubUuids[fspath];
    //         if ( subUuids ) {
    //             for ( var i = 0; i < subUuids.length; ++i ) {
    //                 var subUuid = subUuids[i];
    //                 var subPath = this._uuidToPath[subUuid];

    //                 delete this._pathToUuid[subPath];
    //                 delete this._uuidToPath[subUuid];
    //             }
    //             delete this._pathToSubUuids[fspath];
    //         }
    //     }
    // },
};
