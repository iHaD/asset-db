var Chai = require('chai');
var Task = require('./tasks');

var expect = Chai.expect;

module.exports = {
    /**
     * mount
     * @param {string} path - mount path
     * @param {string} name - mount name
     */
    mount: function ( path, name, cb ) {
        expect(path).to.be.a('string');
        expect(name).to.be.a('string');

        // this._tasks.push( 'mount', Task.mount ( this, path, name, cb ) );
        this._tasks.push({
            name: 'mount',
            run: Task.mount,
            params: [path, name],
        }, cb );
    },

    /**
     * unmount
     * @param {string} name - mount name
     */
    unmount: function ( name ) {
    },

    /**
     * commit current tasks
     */
    commit: function () {
    },
};
