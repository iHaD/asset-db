var Path = require('fire-path');
var Fs = require('fire-fs');
var Del = require('del');

//
var Tasks = require('../lib/tasks');
var JS = require('../lib/js-utils.js');
JS.mixin( Tasks, require('../lib/utils') );
JS.mixin( Tasks, require('../lib/internal') );

describe('Tasks._scan', function () {
    it('should return the results we expect when scan single file', function ( done ) {
        var dest = Path.join( __dirname, 'fixtures/simple-assets-02/foobar.js' );
        Tasks._scan( dest, function ( err, results ) {
            expect(results).to.be.deep.equal([
                dest
            ]);
            done();
        });
    });

    it('should return the results we expect when scan directory', function ( done ) {
        var dest = Path.join( __dirname, 'fixtures/simple-assets-03' );
        Tasks._scan( dest, function ( err, results ) {
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
    var dest = Path.join( __dirname, 'fixtures/assets-with-unused-meta-02' );

    beforeEach(function (done) {
        Fs.copySync( src, dest );
        done();
    });

    afterEach(function (done) {
        Del(dest, done);
    });

    it('should not list unsued meta files in the results', function ( done ) {
        Tasks._scan( dest, { 'remove-unused-meta': false }, function ( err, results ) {
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
        Tasks._scan( dest, { 'remove-unused-meta': true }, function ( err, results ) {
            expect(Fs.existsSync( Path.join( dest, 'unused-folder-meta.meta'))).to.be.false;
            expect(Fs.existsSync( Path.join( dest, 'animation/unused-file-meta.asset.meta'))).to.be.false;
            done();
        });
    });
});

describe('Tasks._initMetas', function () {
    it.skip('should create meta if meta not found');
    it.skip('should not add meta to results if meta failed to load');
    it.skip('should removed unused meta file');
});
