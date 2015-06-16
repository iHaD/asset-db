var Fs = require('fire-fs');
var Path = require('fire-path');
var Chalk = require('chalk');
var Commander = require('commander');
var SpawnSync = require('child_process').spawnSync;

var Mocha = require('mocha');
var Chai = require('chai');
var Base = Mocha.reporters.Base;

//
global.assert = Chai.assert;
global.expect = Chai.expect;
global.sinon = require('sinon');

var run = function ( path ) {
    var stats = Fs.statSync(path);
    if ( !stats.isFile() ) {
        console.error('The path %s you provide is not a file', path);
        process.exit(0);
        return;
    }

    var mocha = new Mocha({
        ui: 'bdd',
        reporter: Spec,
    });
    mocha.addFile(path);

    mocha.run(function (failures) {
        process.exit(failures);
    });
};

function Spec(runner) {
    Base.call(this, runner);

    var self = this,
        stats = this.stats,
        indents = 0,
        n = 0,
        cursor = Base.cursor,
        color = Base.color;

    function indent() {
        return Array(indents).join('  ');
    }

    function _onStart () {}
    function _onSuite ( suite ) {
        ++indents;
        console.log(color('suite', '%s%s'), indent(), suite.title);
    }
    function _onSuiteEnd ( suite ) {
        --indents;
        if (1 == indents) console.log();
    }
    function _onPending ( test ) {
        var fmt = indent() + color('pending', '  - %s');
        console.log(fmt, test.title);
    }
    function _onPass ( test ) {
        var fmt;
        if ('fast' == test.speed) {
            fmt = indent() +
                color('checkmark', '  ' + Base.symbols.ok) +
                color('pass', ' %s');
            cursor.CR();
            console.log(fmt, test.title);
        } else {
            fmt = indent() +
                color('checkmark', '  ' + Base.symbols.ok) +
                color('pass', ' %s') +
                color(test.speed, ' (%dms)');
            cursor.CR();
            console.log(fmt, test.title, test.duration);
        }
    }
    function _onFail ( test, err ) {
        var fmt = indent() +
            color('fail', '  ' + Base.symbols.err) +
            color('fail', ' %s')
            ;
        cursor.CR();
        console.log(fmt, test.title);
    }

    runner.on('start', _onStart);
    runner.on('suite', _onSuite);
    runner.on('suite end', _onSuiteEnd);
    runner.on('pending', _onPending);
    runner.on('pass', _onPass);
    runner.on('fail', _onFail);
    runner.on('end', self.epilogue.bind(self));
}
Spec.prototype = Base.prototype;

//
Commander
    .option('<path>', 'Run tests in path' )
    .parse(process.argv)
    ;

if ( Commander.args[0] ) {
    run(Commander.args[0]);
}
else {
    var cwd = process.cwd();
    var indexFile = Path.join( cwd, 'test/index.js' );

    if ( Fs.existsSync(indexFile) ) {
        files = require(indexFile);
        files.forEach(function ( file ) {
            var path = Path.join( cwd, 'test', file );
            console.log( Chalk.magenta( 'Start test (' + path + ')') );
            SpawnSync('node', [
                Path.join(cwd,'utils/test-runner.js'),
                path
            ], {
                stdio: 'inherit'
            });
        });
    }
}
