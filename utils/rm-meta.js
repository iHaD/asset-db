var Path = require('path');
var Del = require('del');
var Commander = require('commander');

Commander
    .usage('[options] <path ...>')
    .parse(process.argv)
    ;

var cwd = process.cwd();

var target = Commander.args[0];
if ( target ) {
    Del ( Path.join(target, '**/*.meta'), function ( err, paths ) {
        if ( err ) {
            console.error(err);
            return;
        }

        paths.forEach( function ( path ) {
            console.log( 'Delete %s', path );
        });
        console.log('done!');
    });
}
