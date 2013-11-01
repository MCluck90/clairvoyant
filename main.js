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
    .argv;

var PEG = require('pegjs'),
    Compiler = require('./src/compiler.js'),
    fs = require('fs'),
    path = require('path'),
    grammarPath = path.resolve(__dirname, './clairvoyant.pegjs'),
    loadFile = function(path) {
        return fs.readFileSync(path).toString();
    },
    parser = PEG.buildParser(loadFile(grammarPath)),
    source = loadFile(argv.s),
    ast;

try {
    ast = parser.parse(source);
} catch(e) {
    console.log('Line ' + e.line + ', Column ' + e.column + ': ' + e.message);
}

Compiler.compile(ast, {
    use3D: !!argv['3d'],
    failOnWarn: !!argv['fail-on-warning'],
    overwrite: argv.overwrite
});
Compiler.save(argv.o);