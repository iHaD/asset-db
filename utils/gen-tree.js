var Path = require('path');
var Fs = require('fs');
var Minimist = require('minimist');

var argv = Minimist(process.argv.slice(2));
var cwd = process.cwd();
var tree = [];

if ( argv.help ) {
    console.log('Usage: node gen-tree.js path [options]');
    return;
}

var path = argv._[0];
if ( path ) {
    walk( path, tree );

    Fs.writeFileSync( './tree.json', JSON.stringify(tree, null, 2));
}

function walk ( path, treeEntry ) {
    var stat;
    try {
        stat = Fs.statSync(path);
    }
    catch ( err ) {
        return;
    }

    var name = Path.basename(path);
    if ( name[0] === '.' )
        return;

    var extname = Path.extname(path);
    if ( extname === '.meta' )
        return;

    var entry = {
        name: name,
        isDirectory: stat.isDirectory(),
        path: path,
    };
    treeEntry.push(entry);

    if ( stat.isDirectory() ) {
        var files = Fs.readdirSync(path);
        entry.children = [];
        files.forEach( function ( file ) {
            walk( Path.join(path,file), entry.children );
        });
    }
}
