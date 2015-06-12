var Path = require('fire-path');

var AssetMeta = require('../lib/meta/asset');
var Meta = require('../lib/meta');
var JS = require('../lib/js-utils.js');
JS.mixin( Meta, require('../lib/utils') );

function PngMeta () {}
function ImageMeta () {}

describe('Meta.findCtor', function () {
    before(function ( done ) {
        Meta.register('.png', null, false, JS.extend(ImageMeta,AssetMeta));
        Meta.register('.png', '**/particles/*.png', false, JS.extend(PngMeta,AssetMeta));
        done();
    });
    after(function ( done ) {
        Meta.reset();
        done();
    });

    it('should get PngMeta', function ( done ) {
        var ctor = Meta.findCtor( Path.join( __dirname, 'fixtures/example-assets/export/particles/smoke.png') );
        expect(ctor).to.equal(PngMeta);
        done();
    });

    it('should get ImageMeta', function ( done ) {
        var ctor = Meta.findCtor( Path.join( __dirname, 'fixtures/example-assets/export/spineboy/spineboy.png') );
        expect(ctor).to.equal(ImageMeta);
        done();
    });
});
