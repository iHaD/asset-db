var Path = require('fire-path');
var Fs = require('fire-fs');
var Del = require('del');

//
var AssetDB = require('../index');
var Tasks = require('../lib/tasks');

//
describe('Tasks._scan', function () {
    var assetdb;

    before(function ( done ) {
        assetdb = new AssetDB({
            cwd: Path.join( __dirname, 'playground' ),
            library: 'library',
        });
        done();
    });

    after( function ( done ) {
        Del( Path.join( __dirname, 'playground' ), done );
    });

    it('should return the results we expect when scan single file', function ( done ) {
        var dest = Path.join( __dirname, 'fixtures/simple-assets-02/foobar.js' );
        Tasks._scan( assetdb, dest, function ( err, results ) {
            expect(results).to.be.deep.equal([
                dest
            ]);
            done();
        });
    });

    it('should return the results we expect when scan directory', function ( done ) {
        var dest = Path.join( __dirname, 'fixtures/simple-assets-03' );
        Tasks._scan( assetdb, dest, function ( err, results ) {
            expect(results).to.be.deep.equal([
                '',
                'foobar',
                'foobar.js',
                'foobar/foo-01.js',
                'foobar/foo-02.js',
                'foobar/foo-03.js',
            ].map(function (path) {
                return Path.join( dest, path );
            }));
            done();
        });
    });
});

describe('Tasks._scan with unused meta', function () {
    var src = Path.join( __dirname, 'fixtures/assets-with-unused-meta' );
    var dest = Path.join( __dirname, 'playground/assets-with-unused-meta' );
    var assetdb = new AssetDB({
        cwd: Path.join( __dirname, 'playground' ),
        library: 'library',
    });

    after( function ( done ) {
        Del( Path.join( __dirname, 'playground' ), done );
    });

    beforeEach(function (done) {
        Fs.copySync( src, dest );
        done();
    });

    afterEach(function (done) {
        Del(dest, done);
    });

    it('should not list unsued meta files in the results', function ( done ) {
        Tasks._scan( assetdb, dest, { 'remove-unused-meta': false }, function ( err, results ) {
            expect(results).to.not.include.members([
                'unused-folder-meta.meta',
                'animation/unused-file-meta.asset.meta'
            ].map(function (path) {
                return Path.join( dest, path );
            }));
            // expect(Fs.existsSync( Path.join( dest, 'unused-folder-meta.meta'))).to.be.true;
            // expect(Fs.existsSync( Path.join( dest, 'animation/unused-file-meta.asset.meta'))).to.be.true;

            done();
        });
    });

    it('should remove unused meta files during scan', function ( done ) {
        Tasks._scan( assetdb, dest, { 'remove-unused-meta': true }, function ( err, results ) {
            expect(Fs.existsSync( Path.join( dest, 'unused-folder-meta.meta'))).to.be.equal(false);
            expect(Fs.existsSync( Path.join( dest, 'animation/unused-file-meta.asset.meta'))).to.be.equal(false);
            done();
        });
    });
});

describe('Tasks._initMetas', function () {
    var assetdb;
    var src = Path.join( __dirname, 'fixtures/init-meta' );
    var dest = Path.join( __dirname, 'playground/init-meta' );

    before(function ( done ) {
        assetdb = new AssetDB({
            cwd: Path.join( __dirname, 'playground' ),
            library: 'library',
        });
        done();
    });

    after( function ( done ) {
        Del( Path.join( __dirname, 'playground' ), done );
    });

    beforeEach(function (done) {
        Fs.copySync( src, dest );
        done();
    });

    afterEach(function (done) {
        Del(dest, done);
    });

    it('should create meta if meta not found', function ( done ) {
        var mtime = Fs.statSync( Path.join( dest, 'an-asset-with-meta.js.meta' ) ).mtime.getTime();

        Tasks._initMetas( assetdb, dest, function ( err ) {
            expect(Fs.existsSync(Path.join(dest,'a-folder.meta'))).to.be.equal(true);
            expect(Fs.existsSync(Path.join(dest,'a-folder/an-asset.asset.meta'))).to.be.equal(true);

            var mtime2 = Fs.statSync(Path.join(dest,'an-asset-with-meta.js.meta')).mtime.getTime();
            expect(mtime).to.be.equal(mtime2);

            done();
        });
    });

    it('should removed unused meta file', function ( done ) {
        Tasks._initMetas( assetdb, dest, function ( err ) {
            expect(Fs.existsSync(Path.join(dest,'unused-folder-meta.meta'))).to.be.equal(false);
            expect(Fs.existsSync(Path.join(dest,'unused-file-meta.asset.meta'))).to.be.equal(false);

            done();
        });
    });

    it('should not add meta to results if meta failed to load', function ( done ) {
        Tasks._initMetas( assetdb, dest, function ( err, results ) {
            var paths = results.map( function ( item ) {
                return item.assetpath;
            });

            expect(paths).to.have.members([
                Path.join( dest, 'a-folder' ),
                Path.join( dest, 'a-folder/an-asset.asset' ),
                Path.join( dest, 'a-folder-with-meta' ),
                Path.join( dest, 'a-folder-with-meta/empty.asset' ),
                Path.join( dest, 'an-asset-with-meta.js' ),
                Path.join( dest, 'an-asset.atlas' ),
                Path.join( dest, 'an-folder-asset.atlas' ),
                Path.join( dest, 'an-folder-asset.atlas/asset-in-folder-asset.png' ),
            ]);

            done();
        });
    });
});

describe('Tasks._checkIfReimport', function () {
});
