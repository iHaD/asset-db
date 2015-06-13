var Path = require('fire-path');
var Del = require('del');
var Async = require('async');
var AssetDB = require('../index');

describe('AssetDB.mount', function () {
    var assetDB = new AssetDB({
        cwd: Path.join( __dirname, 'playground' ),
        library: 'library',
    });

    after( function ( done ) {
        Async.each(['foo', 'bar'], function ( name, done ) {
            assetDB.unmount( name, done );
        }, function () {
            Del( Path.join( __dirname, 'playground' ), done );
        });
    });

    it('should report error when mount path not exists', function ( done ) {
        assetDB.mount( 'path/not/exists', 'foo', function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    it('should report error when mount path is a file', function ( done ) {
        assetDB.mount( Path.join( __dirname, 'basic.js'), 'foo', function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    it('should report error when mount target have `/`, `\\` or `.`', function ( done ) {
        assetDB.mount( Path.join( __dirname, 'fixtures/simple-assets-01' ), 'foo/bar', function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    it('should mount success to foo for fixtures/simple-assets-01', function ( done ) {
        assetDB.mount( Path.join( __dirname, 'fixtures/simple-assets-01' ), 'foo', function ( err ) {
            expect(err).to.not.exist;
            done();
        });
    });

    it('should report error when mount to foo again', function ( done ) {
        assetDB.mount( Path.join( __dirname, 'fixtures/simple-assets-02' ), 'foo', function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    it('should report error when mount path already used', function ( done ) {
        assetDB.mount( Path.join( __dirname, 'fixtures/simple-assets-01' ), 'bar', function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    it('should report error when you mount a path that its parent already used', function ( done ) {
        assetDB.mount( Path.join( __dirname, 'fixtures/simple-assets-01/foo' ), 'bar', function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    it('should report error when you mount a path that its children already used', function ( done ) {
        assetDB.mount( Path.join( __dirname, 'fixtures' ), 'bar', function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });

    it('should mount success to bar for fixtures/simple-assets-02', function ( done ) {
        assetDB.mount( Path.join( __dirname, 'fixtures/simple-assets-02' ), 'bar', function ( err ) {
            expect(err).to.not.exist;
            done();
        });
    });
});

describe('AssetDB.mount', function () {
    var assetDB = new AssetDB({
        cwd: Path.join( __dirname, 'playground' ),
        library: 'library',
    });

    after( function ( done ) {
        Del( Path.join( __dirname, 'playground' ), done );
    });

    it('should report error when you unmount a not exists node', function ( done ) {
        assetDB.unmount('foobar', function ( err ) {
            console.log(err);
            expect(err).to.be.instanceof(Error);
            done();
        });
    });
});
