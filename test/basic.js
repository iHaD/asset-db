var Fs = require('fire-fs');
var Path = require('fire-path');
var Del = require('del');
var Async = require('async');
var AssetDB = require('../index');
var Meta = require('../lib/meta');

describe('AssetDB.mount', function () {
    var assetdb;
    before(function ( done ) {
        assetdb = new AssetDB({
            cwd: Path.join( __dirname, 'playground' ),
            library: 'library',
        });

        done();
    });

    after( function ( done ) {
        Async.each(['foo', 'bar'], function ( name, done ) {
            assetdb.unmount( name, done );
        }, function () {
            Del( Path.join( __dirname, 'playground' ), done );
        });
    });

    it('should report error when mount path not exists', function ( done ) {
        assetdb.mount( 'path/not/exists', 'foo', function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    it('should report error when mount path is a file', function ( done ) {
        assetdb.mount( Path.join( __dirname, 'basic.js'), 'foo', function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    it('should report error when mount target have `/`, `\\` or `.`', function ( done ) {
        assetdb.mount( Path.join( __dirname, 'fixtures/simple-assets-01' ), 'foo/bar', function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    it('should mount success to foo for fixtures/simple-assets-01', function ( done ) {
        assetdb.mount( Path.join( __dirname, 'fixtures/simple-assets-01' ), 'foo', function ( err ) {
            expect(err).to.not.exist;
            done();
        });
    });

    it('should report error when mount to foo again', function ( done ) {
        assetdb.mount( Path.join( __dirname, 'fixtures/simple-assets-02' ), 'foo', function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    it('should report error when mount path already used', function ( done ) {
        assetdb.mount( Path.join( __dirname, 'fixtures/simple-assets-01' ), 'bar', function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    it('should report error when you mount a path that its parent already used', function ( done ) {
        assetdb.mount( Path.join( __dirname, 'fixtures/simple-assets-01/foo' ), 'bar', function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    it('should report error when you mount a path that its children already used', function ( done ) {
        assetdb.mount( Path.join( __dirname, 'fixtures' ), 'bar', function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    it('should mount success to bar for fixtures/simple-assets-02', function ( done ) {
        assetdb.mount( Path.join( __dirname, 'fixtures/simple-assets-02' ), 'bar', function ( err ) {
            expect(err).to.not.exist;
            done();
        });
    });
});

describe('AssetDB.mount', function () {
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

    it('should report error when you unmount a not exists node', function ( done ) {
        assetdb.unmount('foobar', function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });
});

describe('AssetDB.init', function () {
    var assetdb;

    describe('init-no-meta', function () {
        var src = Path.join( __dirname, 'fixtures/init-no-meta' );
        var dest = Path.join( __dirname, 'playground/init-no-meta' );

        before(function ( done ) {
            assetdb = new AssetDB({
                cwd: Path.join( __dirname, 'playground' ),
                library: 'library',
            });

            Fs.copySync( src, dest );
            assetdb.mount( dest, 'assets', function ( err ) {
                done ();
            });
        });

        after( function ( done ) {
            Del( Path.join( __dirname, 'playground' ), done );
        });

        it('should create meta after init', function ( done ) {
            assetdb.init(function ( err ) {
                expect( Fs.existsSync( Path.join(dest,'a-folder.meta') ) ).to.be.equal(true);
                expect( Fs.existsSync( Path.join(dest,'a-folder/an-asset.asset.meta') ) ).to.be.equal(true);
                expect( Fs.existsSync( Path.join(dest,'an-asset.atlas.meta') ) ).to.be.equal(true);
                expect( Fs.existsSync( Path.join(dest,'an-folder-asset.atlas.meta') ) ).to.be.equal(true);
                expect( Fs.existsSync( Path.join(dest,'an-folder-asset.atlas/asset-in-folder-asset.png.meta') ) ).to.be.equal(true);

                var meta = Meta.load( assetdb, Path.join(dest,'a-folder.meta') );
                expect(meta).to.be.instanceof(Meta.FolderMeta);
                expect(meta['meta-type']).to.be.equal('folder');
                expect( Fs.existsSync(assetdb._uuid2importPath(meta.uuid)) ).to.be.equal(false);

                meta = Meta.load( assetdb, Path.join(dest,'an-asset.atlas.meta') );
                expect(meta).to.be.instanceof(Meta.AssetMeta);
                expect(meta['meta-type']).to.be.equal('asset');
                expect( Fs.existsSync(assetdb._uuid2importPath(meta.uuid)) ).to.be.equal(true);

                done();
            });
        });
    });

    describe('init-with-meta', function () {
        var src = Path.join( __dirname, 'fixtures/init-with-meta' );
        var dest = Path.join( __dirname, 'playground/init-with-meta' );
        var mtimeList = {};

        beforeEach(function ( done ) {
            assetdb = new AssetDB({
                cwd: Path.join( __dirname, 'playground' ),
                library: 'library',
            });

            Fs.copySync( src, dest );
            assetdb.mount( dest, 'assets', function ( err ) {
                done ();
            });

            mtimeList = {
                'a-folder.meta': Fs.statSync( Path.join(dest,'a-folder.meta') ).mtime,
                'a-folder/an-asset.asset.meta': Fs.statSync( Path.join(dest,'a-folder/an-asset.asset.meta') ).mtime,
                'an-asset.atlas.meta': Fs.statSync( Path.join(dest,'an-asset.atlas.meta') ).mtime,
                'an-folder-asset.atlas.meta': Fs.statSync( Path.join(dest,'an-folder-asset.atlas.meta') ).mtime,
                'an-folder-asset.atlas/asset-in-folder-asset.png.meta': Fs.statSync( Path.join(dest,'an-folder-asset.atlas/asset-in-folder-asset.png.meta') ).mtime,
            };
        });

        afterEach( function ( done ) {
            Del( Path.join( __dirname, 'playground' ), done );
        });

        it('should create library file after init', function ( done ) {
            assetdb.init(function ( err ) {
                var meta = Meta.load( assetdb, Path.join(dest,'a-folder.meta') );
                expect(meta).to.be.instanceof(Meta.FolderMeta);
                expect( Fs.existsSync(assetdb._uuid2importPath(meta.uuid)) ).to.be.equal(false);

                meta = Meta.load( assetdb, Path.join(dest,'an-asset.atlas.meta') );
                expect(meta).to.be.instanceof(Meta.AssetMeta);
                expect( Fs.existsSync(assetdb._uuid2importPath(meta.uuid)) ).to.be.equal(true);

                done();
            });
        });

        it('should not touch the original meta', function ( done ) {
            assetdb.init(function ( err ) {
                for ( var p in mtimeList ) {
                    expect( Fs.statSync(Path.join(dest,p)).mtime.getTime() ).to.be.equal( mtimeList[p].getTime() );
                }

                done();
            });
        });
    });

    describe('init-with-meta-and-lib', function () {
        var src = Path.join( __dirname, 'fixtures/init-with-meta-and-lib/' );
        var destPlayground = Path.join( __dirname, 'playground/init-with-meta-and-lib/' );

        var dest = Path.join( __dirname, 'playground/init-with-meta-and-lib/assets' );
        var mtimeList = {};

        beforeEach(function ( done ) {
            Fs.copySync( src, destPlayground );

            assetdb = new AssetDB({
                cwd: Path.join( __dirname, 'playground' ),
                library: 'init-with-meta-and-lib/library',
            });

            assetdb.mount( dest, 'assets', function ( err ) {
                done ();
            });

            mtimeList = {
                'a-folder.meta': Fs.statSync( Path.join(dest,'a-folder.meta') ).mtime,
                'a-folder/an-asset.asset.meta': Fs.statSync( Path.join(dest,'a-folder/an-asset.asset.meta') ).mtime,
                'an-asset.atlas.meta': Fs.statSync( Path.join(dest,'an-asset.atlas.meta') ).mtime,
                'an-folder-asset.atlas.meta': Fs.statSync( Path.join(dest,'an-folder-asset.atlas.meta') ).mtime,
                'an-folder-asset.atlas/asset-in-folder-asset.png.meta': Fs.statSync( Path.join(dest,'an-folder-asset.atlas/asset-in-folder-asset.png.meta') ).mtime,
            };
        });

        afterEach( function ( done ) {
            Del( Path.join( __dirname, 'playground' ), done );
        });

        it('should not touch the original meta', function ( done ) {
            assetdb.init(function ( err ) {
                for ( var p in mtimeList ) {
                    expect( Fs.statSync(Path.join(dest,p)).mtime.getTime() ).to.be.equal( mtimeList[p].getTime() );
                }

                done();
            });
        });

        it('should remove unused import files', function ( done ) {
            assetdb.init(function ( err ) {
                var deadbeaf = Path.join(assetdb._importPath, 'de/deadbeaf-dead-beaf-dead-beafdeadbeaf' );
                expect( Fs.existsSync(deadbeaf) ).to.be.equal(false);

                done();
            });
        });
    });

});
