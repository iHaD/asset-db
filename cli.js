var Commander = require('commander');
var AssetDB = require('./index');
var REPL = require('repl');

// ---------------------------
// initialize Commander
// ---------------------------

var pjson = require('./package.json');

// NOTE: commander only get things done barely in core level,
//       it doesn't touch the page level, so it should not put into App.on('ready')
Commander
    .version(pjson.version)
    .option('--dev', 'Run in development mode')
    ;

// usage
Commander
    .usage('[options] <library ...>')
    ;

// command
// Commander
//     .command('foobar').action( function () {
//         console.log('foobar!!!');
//         // process.exit(1);
//     })
//     ;
Commander.parse(process.argv);

var library = Commander.args.length > 0 ? Commander.args[0] : 'library';
var assetDB = new AssetDB({
    'cwd': process.cwd(),
    'library': library,
});

// ---------------------------
// initialize REPL
// ---------------------------

// function dbEval( cmd, context, filename, callback ) {
//     // FIXME: this is a bug come from io.js, without this, <Tab> complete will report error.
//     if (cmd === '.scope')
//         callback(null);
//     else
//         callback(null, cmd);
// }

var repl = REPL.start({
    prompt: 'asset-db> ',
    input: process.stdin,
    output: process.stdout,
    // eval: dbEval,
});
repl.context.db = assetDB;
