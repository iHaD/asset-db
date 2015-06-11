var Fs = require('fire-fs');
var Path = require('fire-path');
var Url = require('fire-url');

module.exports = {
    mount: function ( path, name, cb ) {
        if ( this._mounts[name] ) {
            throw new Error ( 'Failed to mount %s to %s, already exists!', path, name );
        }
        this._mounts[name] = path;

        // refresh mountings

        if ( cb ) cb ();
    },
};
