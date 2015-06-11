var Path = require('fire-path');
var AssetDB = require('../index');

describe('Basic Tests', function () {
    var assetDB = new AssetDB({
        cwd: Path.join( __dirname, 'fixtures' ),
        library: 'library',
    });

    it('AssetDB.mount', function ( done ) {
        assetDB.mount( Path.join( __dirname, 'fixtures/simple' ), 'assets', function ( err ) {
            done();
        });
    });
});
