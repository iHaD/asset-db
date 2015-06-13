var Path = require('fire-path');

var AssetMeta = require('../lib/meta/asset');
var FolderMeta = require('../lib/meta/folder');
var Meta = require('../lib/meta');
var JS = require('../lib/js-utils.js');
JS.mixin( Meta, require('../lib/utils') );

function PngMeta () {}
function ImageMeta () {}
function AtlasFolderMeta () {}
function AtlasMeta () {}

describe('Meta.findCtor', function () {
    before(function ( done ) {
        Meta.register('.png', null, false, JS.extend(ImageMeta,AssetMeta));
        Meta.register('.png', '**/particles/*.png', false, JS.extend(PngMeta,AssetMeta));

        Meta.register('.atlas', null, true, JS.extend(AtlasFolderMeta,AssetMeta));
        Meta.register('.atlas', null, false, JS.extend(AtlasMeta,AssetMeta));
        done();
    });
    after(function ( done ) {
        Meta.reset();
        done();
    });

    it('should get PngMeta', function ( done ) {
        var ctor = Meta.findCtor( Path.join( __dirname, 'fixtures/meta-test/some-assets/particles/smoke.png') );
        expect(ctor).to.equal(PngMeta);
        done();
    });

    it('should get ImageMeta', function ( done ) {
        var ctor = Meta.findCtor( Path.join( __dirname, 'fixtures/meta-test/some-assets/spineboy/spineboy.png') );
        expect(ctor).to.equal(ImageMeta);
        done();
    });

    it('should get AssetMeta', function ( done ) {
        var ctor = Meta.findCtor( Path.join( __dirname, 'fixtures/meta-test/animation/down.asset') );
        expect(ctor).to.equal(AssetMeta);
        done();
    });

    it('should get FolderMeta', function ( done ) {
        var ctor = Meta.findCtor( Path.join( __dirname, 'fixtures/meta-test/animation/') );
        expect(ctor).to.equal(FolderMeta);
        done();
    });

    it('should get AtlasMeta', function ( done ) {
        var ctor = Meta.findCtor( Path.join( __dirname, 'fixtures/meta-test/atlas-asset.atlas') );
        expect(ctor).to.equal(AtlasMeta);
        done();
    });

    it('should get AtlasFolderMeta', function ( done ) {
        var ctor = Meta.findCtor( Path.join( __dirname, 'fixtures/meta-test/atlas-folder.atlas') );
        expect(ctor).to.equal(AtlasFolderMeta);
        done();
    });
});
