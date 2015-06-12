var Path = require('path');
var Fs = require('fs');
var Commander = require('commander');

//
Commander
    .option('--version [v] <path>', 'Migrate to version at path' )
    .parse(process.argv)
    ;

var cwd = process.cwd();
var VER = '0.2.0';

var metaMigrater = {
    '0.1.3': function ( meta, cb ) {
        if ( meta.subAssets ) {
            meta.subRawData = [];
            for ( var i = 0; i < meta.subAssets.length; ++i ) {
                meta.subRawData.push(meta.subAssets[i]);
            }
            delete meta.subAssets;
        }

        if ( cb ) {
            cb ( meta );
        }
    },

    '0.2.0': function ( meta, cb ) {
        meta.__type__ = meta.__type__.replace(/^Fire/, 'Editor');

        if ( meta.subRawData ) {
            for ( var i = 0; i < meta.subRawData.length; ++i ) {
                var subMeta = meta.subRawData[i].meta;
                subMeta.__type__ = subMeta.__type__.replace(/^Fire/, 'Editor');
            }
        }

        if ( cb ) {
            cb ( meta );
        }
    }
};

// version
var version = Commander.version;
if ( !version ) {
    console.log('Please specify a version for update!');
    return;
}

if ( !metaMigrater[version] ) {
    console.log('Can not find updater for v%s!', version);
    return;
}

// path
var path = Commander.args[0];
if ( path ) {
    console.log('scanning %s', path);
    walk( path );
    console.log('done!');
}

function walk ( path ) {
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
    if ( extname === '.meta' ) {
        // process meta
        Fs.readFile( path, function ( err, data ) {
            console.log('Update meta file: %s', path);
            if ( !err ) {
                var meta = JSON.parse(data);
                metaMigrater[version](meta, function ( meta ) {
                    Fs.writeFile( path, JSON.stringify(meta, null, 2) );
                });
            }
        });
    }

    //
    if ( stat.isDirectory() ) {
        var files = Fs.readdirSync(path);
        files.forEach( function ( file ) {
            walk( Path.join(path,file) );
        });
    }
}
