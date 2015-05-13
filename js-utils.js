/**
 * @param {object} obj
 * @param {string} name
 * @return {object}
 */
function _getPropertyDescriptor(obj, name) {
    if (obj) {
        var pd = Object.getOwnPropertyDescriptor(obj, name);
        return pd || _getPropertyDescriptor(Object.getPrototypeOf(obj), name);
    }
}

function _copyprop(name, source, target) {
    var pd = _getPropertyDescriptor(source, name);
    Object.defineProperty(target, name, pd);
}

module.exports = {
    /**
     * copy all properties not defined in obj from arguments[1...n]
     * @method addon
     * @param {object} obj object to extend its properties
     * @param {object} ...sourceObj source object to copy properties from
     * @return {object} the result obj
     */
    addon: function (obj) {
        'use strict';
        obj = obj || {};
        for (var i = 1, length = arguments.length; i < length; i++) {
            var source = arguments[i];
            for ( var name in source) {
                if ( !(name in obj) ) {
                    _copyprop( name, source, obj);
                }
            }
        }
        return obj;
    },

    /**
     * copy all properties from arguments[1...n] to obj
     * @method mixin
     * @param {object} obj
     * @param {object} ...sourceObj
     * @return {object} the result obj
     */
    mixin: function (obj) {
        'use strict';
        obj = obj || {};
        for (var i = 1, length = arguments.length; i < length; i++) {
            var source = arguments[i];
            if (source) {
                if (typeof source !== 'object') {
                    console.error('JS.mixin called on non-object:', source);
                    continue;
                }
                for ( var name in source) {
                    _copyprop( name, source, obj);
                }
            }
        }
        return obj;
    },
};
