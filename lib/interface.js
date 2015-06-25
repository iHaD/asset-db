var Task = require('./tasks');
var Meta = require('./meta');

module.exports = {
    /**
     */
    urlToUuid: function ( url ) {
        var fspath = this._fspath(url);
        return this.fspathToUuid(fspath);
    },

    /**
     */
    fspathToUuid: function ( fspath ) {
        return this._path2uuid[fspath];
    },

    /**
     */
    uuidToFspath: function ( uuid ) {
        return this._uuid2path[uuid];
    },

    /**
     */
    uuidToUrl: function ( uuid ) {
        var fspath = this.uuidToFspath(uuid);
        this._url(fspath);
    },

    /**
     * mount to the name, if you don't provide a name, it will mount to root.
     * @param {string} path - raw fs-path
     * @param {string} name - name to mount
     * @param {function} [cb] - a callback function
     */
    mount: function ( path, name, cb ) {
        this._tasks.push({
            name: 'mount',
            run: Task.mount,
            params: [path, name]
        }, cb );
    },

    /**
     * unmount the name
     * @param {string} name - the mounting name
     * @param {function} [cb]
     */
    unmount: function ( name, cb ) {
        this._tasks.push({
            name: 'unmount',
            run: Task.unmount,
            params: [name],
        }, cb );
    },

    /**
     * init
     * @param {function} [cb]
     */
    init: function ( cb ) {
        this._tasks.push({
            name: 'init',
            run: Task.init,
            params: [],
        }, cb );
    },

    /**
     * refresh the assets in url
     * @param {string} url
     * @param {function} [cb]
     */
    refresh: function ( url, cb ) {
        var fspath = this._fspath(url);

        this._tasks.push({
            name: 'refresh',
            run: Task.refresh,
            params: [fspath],
        }, cb );
    },

    /**
     * deepQuery
     * @param {function} [cb]
     */
    deepQuery: function ( cb ) {
        this._tasks.push({
            name: 'deep-query',
            run: Task.deepQuery,
            params: [],
        }, cb );
    },

    // TODO
    // import: function ( urlPattern ) {
    //     var fsPattern = this._fspath(urlPattern);
    //     if ( fsPattern === null ) {
    //         this.throw('normal', 'Invalid pattern %s', urlPattern);
    //     }

    //     this._tasks.push({
    //         name: 'import',
    //         run: Task.import,
    //         params: [fsPattern],
    //     }, cb );
    // },

    register: function ( extname, folder, metaCtor ) {
        Meta.register( this, extname, folder, metaCtor );
    },

    unregister: function ( metaCtor ) {
        Meta.unregister( this, metaCtor );
    },
};
