'use strict';

var Compiler = require('./compiler.js'),
    Writer = require('./writer.js'),

    preParser = require('../parsers/preprocessor.js'),
    sourceParser = require('../parsers/clairvoyant.js'),

    fs = require('fs'),
    path = require('path'),
    extend = require('xtend');

/**
 * Exposes Clairvoyant as a module to use programatically
 * @param {object}   options
 * @param {string}   options.src                 - Source file
 * @param {string}   options.output              - Path to the file to place the project in
 * @param {boolean} [options.is3d=false]         - If true, will compile for Psykick3D
 * @param {boolean} [options.failOnWarn=false]   - If true, will fail when a warning is issued
 * @param {boolean} [options.overwrite=false]    - If true, will overwrite existing files
 * @param {string}  [options.reporter='default'] - Specify which reporter to load
 * @constructor
 */
var Clairvoyant = function(options) {
    options = extend({
        src: '',
        output: '',
        is3d: false,
        failOnWarn: false,
        overwrite: false,
        reporter: 'default'
    }, options);

    if (!options.src || !options.output) {
        throw new Error('Must specify source file and output directory');
    }

    var reporterConstructor;
    if (options.reporter === 'default') {
        reporterConstructor = require('./reporter.js').Reporter;
    } else {
        reporterConstructor = require('./reporters/' + options.reporter + '.js');
    }

    if (reporterConstructor === undefined) {
        throw new Error('Invalid reporter given');
    }

    this.reporter = new reporterConstructor(options.failOnWarn);
    this.sourceCode = fs.readFileSync(options.src, 'utf-8');
    this.psykickVersion = (options.is3d) ? '3d' : '2d';
    this.sourcePath = options.src;
    this.outputPath = options.output;
    this.overwrite = options.overwrite;
    this.ast = null;
    this.compiler = null;
    this.writer = null;
};

/**
 * Parses out the AST
 */
Clairvoyant.prototype.parse = function() {
    try {
        this.sourceCode = preParser.parse(this.sourceCode, {
            sourceFolder: path.dirname(this.sourcePath)
        });

        this.ast = sourceParser.parse(this.sourceCode);
    } catch(e) {
        this.reporter.logSyntaxError(e);
    }
};

/**
 * Compiles and saves the project
 */
Clairvoyant.prototype.compile = function() {
    this.compiler = new Compiler(this.ast, this.reporter, this.psykickVersion);
    this.writer = new Writer({
        projectName: this.ast.name,
        rootPath: this.outputPath,
        reporter: this.reporter,
        overwrite: this.overwrite
    });

    var compiled = this.compiler.compile();
    this.writer.save(compiled);
};

module.exports = Clairvoyant;