var Fs = require('fire-fs');
var Path = require('fire-path');
var Del = require('del');

var AssetDB = require('../index');
var Meta = require('../lib/meta');
var JS = require('../lib/js-utils');

function PngMeta () {}
function ImageMeta () {}
function AtlasFolderMeta () {}
function AtlasMeta () {}

describe('Meta.findCtor', function () {
    var assetdb;
    var src = Path.join( __dirname, 'fixtures/meta-find-ctor' );
    var dest = Path.join( __dirname, 'playground/meta-find-ctor' );

    before(function ( done ) {
        assetdb = new AssetDB({
            cwd: Path.join( __dirname, 'playground' ),
            library: 'library',
        });

        Meta.register(assetdb, '.png', null, false, JS.extend(ImageMeta,Meta.AssetMeta));
        Meta.register(assetdb, '.png', '**/particles/*.png', false, JS.extend(PngMeta,Meta.AssetMeta));

        Meta.register(assetdb, '.atlas', null, true, JS.extend(AtlasFolderMeta,Meta.AssetMeta));
        Meta.register(assetdb, '.atlas', null, false, JS.extend(AtlasMeta,Meta.AssetMeta));

        done();
    });

    after(function ( done ) {
        Meta.reset(assetdb);
        Del( Path.join( __dirname, 'playground' ), done );
    });

    beforeEach(function (done) {
        Fs.copySync( src, dest );
        done();
    });

    afterEach(function (done) {
        Del(dest, done);
    });

    it('should get PngMeta', function ( done ) {
        var ctor = Meta.findCtor(assetdb, Path.join( dest, 'some-assets/particles/smoke.png') );
        expect(ctor).to.equal(PngMeta);
        done();
    });

    it('should get ImageMeta', function ( done ) {
        var ctor = Meta.findCtor(assetdb, Path.join( dest, 'some-assets/spineboy/spineboy.png') );
        expect(ctor).to.equal(ImageMeta);
        done();
    });

    it('should get AssetMeta', function ( done ) {
        var ctor = Meta.findCtor(assetdb, Path.join( dest, 'a-folder/an-asset.asset') );
        expect(ctor).to.equal(Meta.AssetMeta);
        done();
    });

    it('should get FolderMeta', function ( done ) {
        var ctor = Meta.findCtor(assetdb, Path.join( dest, 'a-folder') );
        expect(ctor).to.equal(Meta.FolderMeta);
        done();
    });

    it('should get AtlasMeta', function ( done ) {
        var ctor = Meta.findCtor(assetdb, Path.join( dest, 'atlas-asset.atlas') );
        expect(ctor).to.equal(AtlasMeta);
        done();
    });

    it('should get AtlasFolderMeta', function ( done ) {
        var ctor = Meta.findCtor(assetdb, Path.join( dest, 'atlas-folder.atlas') );
        expect(ctor).to.equal(AtlasFolderMeta);
        done();
    });
});
