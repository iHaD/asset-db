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
};
