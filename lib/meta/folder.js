var JS = require('../js-utils');
var $super = require('./asset');

function FolderMeta () {
    $super.call(this);
}
JS.extend(FolderMeta,$super);

module.exports = FolderMeta;

