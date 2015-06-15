var JS = require('../js-utils');
var $super = require('./asset');

function FolderMeta () {
    $super.call(this);
}
JS.extend(FolderMeta,$super);

FolderMeta.prototype.import = null;
FolderMeta.prototype.export = null;

module.exports = FolderMeta;

