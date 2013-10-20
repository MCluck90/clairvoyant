'use strict';

if (process.argv.length < 3) {
    console.log('Usage: node main.js inputfile [3d]');
    process.exit(1);
}

var PEG = require('pegjs'),
    Compiler = require('./src/compiler.js'),
    fs = require('fs'),
    path = require('path'),
    grammarPath = path.resolve(__dirname, './clairvoyant.pegjs'),
    loadFile = function(path) {
        return fs.readFileSync(path).toString();
    },
    use3D = process.argv[3] === '3d';

var parser = PEG.buildParser(loadFile(grammarPath));

var source = loadFile(process.argv[2]);
var ast;

try {
    ast = parser.parse(source);
} catch(e) {
    console.log('Line ' + e.line + ', Column ' + e.column + ': ' + e.message);
}

Compiler.compile(ast, use3D);