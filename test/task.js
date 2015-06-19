var Path = require('fire-path');
var Fs = require('fire-fs');
var Del = require('del');
var Async = require('async');

//
var AssetDB = require('../index');
var Tasks = require('../lib/tasks');
var Meta = require('../lib/meta');
var JS = require('../lib/js-utils');

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
    var assetdb;
    var src = Path.join( __dirname, 'fixtures/check-if-reimport/' );
    var dest = Path.join( __dirname, 'playground/check-if-reimport' );

    beforeEach(function ( done ) {
        function AtlasFolderMeta () {}

        Fs.copySync( src, dest );

        assetdb = new AssetDB({
            cwd: Path.join( __dirname, 'playground' ),
            library: 'library',
        });
        Meta.register(assetdb, '.atlas', null, true, JS.extend(AtlasFolderMeta,Meta.AssetMeta));

        Async.series([
            function ( next ) {
                assetdb.mount( dest, 'assets', next );
            },

            function ( next ) {
                assetdb.init( next );
            },

            function ( next ) {
                var meta = Meta.load( assetdb, Path.join(dest, 'an-asset-not-in-library.js.meta') );

                Del([
                    assetdb._uuid2importPath( meta.uuid ),
                    Path.join(dest, 'an-asset-without-meta.js.meta'),
                    Path.join(dest, 'an-folder-asset.atlas/asset-in-folder-asset-without-meta.png.meta'),
                ], next );
            },

            function ( next ) {
                var meta = Meta.load( assetdb, Path.join(dest, 'an-asset-changes-outside.js.meta') );
                var now = new Date();

                assetdb._uuid2mtime[meta.uuid] = {
                    asset: now.getTime(),
                    meta: now.getTime(),
                };

                assetdb.updateMtime();
                next();
            },
        ], function () {
            setTimeout( done, 100 );
        });

    });

    afterEach( function ( done ) {
        Del( Path.join( __dirname, 'playground' ), done );
    });

    it('should get reimport results', function ( done ) {
        var tests = [
            {
                path: Path.join( dest, 'a-folder-with-meta' ),
                result: true,
            },
            {
                path: Path.join( dest, 'a-folder-with-meta/an-asset-with-meta.js' ),
                result: false,
            },
            {
                path: Path.join( dest, 'an-asset-changes-outside.js' ),
                result: true,
            },
            {
                path: Path.join( dest, 'an-asset-not-in-library.js' ),
                result: true,
            },
            {
                path: Path.join( dest, 'an-asset-without-meta.js' ),
                result: true,
            },
            {
                path: Path.join( dest, 'an-folder-asset.atlas' ),
                result: false,
            },
            {
                path: Path.join( dest, 'an-folder-asset.atlas/asset-in-folder-asset.png' ),
                result: false,
            },
            {
                path: Path.join( dest, 'an-folder-asset.atlas/asset-in-folder-asset-without-meta.png' ),
                result: true,
            },
            {
                path: Path.join( dest, 'meta-has-error.js' ),
                result: true,
            },
        ];

        Async.each( tests, function ( test, done ) {
            Tasks._checkIfReimport( assetdb, test.path, function ( err, reimport ) {
                console.log('check %s', test.path );
                expect( test.result ).to.be.equal(reimport);
                done();
            });
        }, function () {
            done();
        });
    });
});

describe('Tasks.deepQuery', function () {
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
        function AtlasFolderMeta () {}

        Fs.copySync( src, dest );

        assetdb = new AssetDB({
            cwd: Path.join( __dirname, 'playground' ),
            library: 'library',
        });
        Meta.register(assetdb, '.atlas', null, true, JS.extend(AtlasFolderMeta,Meta.AssetMeta));

        Async.series([
            function ( next ) {
                assetdb.mount( dest, 'assets', next );
            },

            function ( next ) {
                assetdb.init( next );
            },
        ], function () {
            done();
        });
    });

    afterEach(function (done) {
        Del(dest, done);
    });

    it('should query results', function ( done ) {
        Tasks.deepQuery( assetdb, function ( results ) {
            expect(results[0].name).to.be.equal('assets');
            expect(results[0].children[0].name).to.be.equal('a-folder-with-meta');
            expect(results[0].children[0].type).to.be.equal('FolderMeta');
            // console.log( JSON.stringify(results, null, 2));
        });

        done();
    });
});
