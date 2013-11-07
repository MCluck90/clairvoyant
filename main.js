'use strict';

var argv = require('optimist')
    .usage('Usage: cvt -s source -o output [options]')
    .demand('s')
    .alias('s', 'src')
    .describe('s', 'Source file ')
    .demand('o')
    .alias('o', 'output')
    .describe('o', 'Name of the folder to output the project to')
    .default('3d', false)
    .describe('3d', 'If set, will compile for Psykick3D')
    .default('fail-on-warning', false)
    .describe('fail-on-warning', 'If set, compilation will fail when a warning is issued')
    .default('overwrite', false)
    .describe('overwrite', 'Overwrite pre-existing files')
    .argv,

    Compiler = require('./src/compiler.js'),
    fs = require('fs'),
    path = require('path'),

    // Loads up a file and returns it as a string
    loadFile = function(p) {
        return fs.readFileSync(p).toString();
    },

    // Parser for the preprocessor
    preprocessorParser = require('./parsers/preprocessor.js'),

    // Parser for the actual final source
    sourceParser = require('./parsers/clairvoyant.js'),

    // Source code
    source = loadFile(argv.s);

try {
    // Parse any preprocessor messages
    source = preprocessorParser.parse(source, {
        sourceFolder: path.dirname(path.resolve(process.cwd(), argv.s))
    });


    // Parse out the final source after any preprocessing
    var ast = sourceParser.parse(source);

    Compiler.compile(ast, {
        use3D: !!argv['3d'],
        failOnWarn: !!argv['fail-on-warning'],
        overwrite: argv.overwrite
    });
    Compiler.save(argv.o);
} catch(e) {
    console.log('Line ' + e.line + ', Column ' + e.column + ': ' + e.message);
}