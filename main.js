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

    Compiler = require('./src/compiler.js'),
    Reporter = (argv.reporter === 'default') ? require('./src/reporter.js').Reporter :
                                               require('./src/reporters/' + argv.reporter + '.js'),
    Writer = require('./src/writer.js'),
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
    source = loadFile(argv.s),

    ast, reporter, compiler, writer;

// Make sure the user selected a valid reporter
if (Reporter === undefined) {
    throw new Error('Invalid reporter. Check src/reporters for available types');
}

reporter = new Reporter(!!argv['fail-on-warning']);

try {
    // Parse any preprocessor messages
    source = preprocessorParser.parse(source, {
        sourceFolder: path.dirname(path.resolve(process.cwd(), argv.s))
    });

    // Parse out the final source after any preprocessing
    ast = sourceParser.parse(source);
} catch(e) {
    reporter.logSyntaxError(e);
}

// Compile it down to actual code
compiler = new Compiler(ast, reporter, (argv['3d']) ? '3d' : '2d');
writer = new Writer({
    projectName: ast.name,
    rootPath: path.resolve(process.cwd(), argv.o),
    reporter: reporter,
    overwrite: argv.overwrite
});

// Write the project to disk
writer.save(compiler.compile());