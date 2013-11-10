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
        .default('reporter', 'default')
        .describe('reporter', 'Build information reporter. Expects a filename from src/reporters with the .js')
        .argv,

    path = require('path'),
    Clairvoyant = require('./src/main.js');

var c = new Clairvoyant({
    src: path.resolve(process.cwd(), argv.s),
    output: path.resolve(process.cwd(), argv.o),
    is3d: !!argv['3d'],
    failOnWarn: !!argv['fail-on-warning'],
    overwrite: !!argv.overwrite,
    reporter: argv.reporter
});

c.parse();
c.compile();