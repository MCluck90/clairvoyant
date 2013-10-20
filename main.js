'use strict';

if (process.argv.length < 3) {
    console.log('Usage: node main.js inputfile [3d]');
    process.exit(1);
}

var PEG = require('pegjs'),
    fs = require('fs'),
    loadFile = function(path) {
        return fs.readFileSync(path).toString();
    },
    use3D = process.argv[3] === '3d';

var parser = PEG.buildParser(loadFile('./clairvoyant.pegjs'));

var source = loadFile(process.argv[2]);
var ast;

try {
    ast = parser.parse(source);
    console.log(JSON.stringify(ast, null, 4));
} catch(e) {
    console.log('Line ' + e.line + ', Column ' + e.column + ': ' + e.message);
}