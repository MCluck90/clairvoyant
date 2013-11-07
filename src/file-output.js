'use strict';

var fs = require('fs'),
    path = require('path');

/**
 *
 * @param {object}   options
 * @param {string}   options.projectName
 * @param {string}   options.rootPath
 * @param {string}   options.componentsFolder
 * @param {string}   options.systemsFolder
 * @param {Reporter} options.reporter
 * @constructor
 */
var Writer = function(options) {
    this.projectName = options.projectName;
    this.rootPath = options.rootPath;
    this.componentsFolder = path.resolve(options.rootPath, options.componentsFolder);
    this.systemsFolder = path.resolve(options.rootPath, options.systemsFolder);
    this.reporter = options.reporter;
    this.overwrite = options.overwrite;

    this.remainingFiles = 0;
};

/**
 * Saves the code to disk
 * @param {{
 *      components: CodeMessage[],
 *      systems: CodeMessage[],
 *      factory: CodeMessage
 * }} code
 */
Writer.prototype.save = function(code) {
    this.remainingFiles = code.components.length +
                          code.systems.length +
                          1; // Factory

    if (!fs.existsSync(this.rootPath)) {
        fs.mkdirSync(this.rootPath);
    }
    if (!fs.existsSync(this.componentsFolder)) {
        fs.mkdirSync(this.componentsFolder);
    }
    if (!fs.existsSync(this.systemsFolder)) {
        fs.mkdirSync(this.systemsFolder);
    }

    this.saveComponents(code.components);
    this.saveSystems(code.systems);
    this.saveFactory(code.factory);
};

/**
 * Writes the components to disk
 * @param {CodeMessage[]} components
 */
Writer.prototype.saveComponents = function(components) {
    var componentFolder = this.componentsFolder,
        self = this;
    for (var i = 0, len = components.length; i < len; i++) {
        (function(component) {
            var filePath = path.resolve(componentFolder, component.filename),
                writeToFile = (self.overwrite || !fs.existsSync(filePath));

            if (writeToFile) {
                fs.writeFile(filePath, component.code, function(err) {
                    if (err) {
                        self.reporter.error(err);
                    } else {
                        self.reporter.logComponent(component.message);
                        self.remainingFiles -= 1;
                    }
                    this.attemptComplete();
                });
            } else {
                this.reporter.logComponent(component.message, true);
                this.remainingFiles -= 1;
                this.attemptComplete();
            }
        })(components[i]);
    }
};

/**
 * Writes out the Systems to disk
 * @param {CodeMessage[]} systems
 */
Writer.prototype.saveSystems = function(systems) {
    var systemFolder = this.systemsFolder,
        self = this;
    for (var i = 0, len = systems.length; i < len; i++) {
        (function(system) {
            var filePath = path.resolve(systemFolder, system.filename),
                writeToFile = (self.overwrite || !fs.existsSync(filePath));

            if (writeToFile) {
                fs.writeFile(filePath, system.code, function(err) {
                    if (err) {
                        self.reporter.error(err);
                    } else {
                        self.reporter.logSystem(system.message);
                        self.remainingFiles -= 1;
                        self.attemptComplete();
                    }
                });
            } else {
                this.reporter.logSystem(system.message, true);
                this.remainingFiles -= 1;
                this.attemptComplete();
            }
        })(systems[i]);
    }
};

/**
 * Writes out the Factory to disk
 * @param {CodeMessage} factory
 */
Writer.prototype.saveFactory = function(factory) {
    var self = this,
        filePath = path.resolve(this.rootPath, factory.filename);
    if (this.overwrite || !fs.existsSync(filePath)) {
        fs.writeFile(filePath, factory.code, function(err) {
            if (err) {
                self.reporter.error(err);
            } else {
                self.reporter.logFactory(factory.message);
                self.remainingFiles -= 1;
                self.attemptComplete();
            }
        });
    } else {
        this.reporter.logFactory(factory.message, true);
        this.remainingFiles -= 1;
        this.attemptComplete();
    }
};

/**
 * Logs the complete message
 */
Writer.prototype.attemptComplete = function() {
    if (this.remainingFiles === 0) {
        this.reporter.complete(this.projectName);
    }
};

/**
 * A message which the writer can understand
 * @param {string}                                        filename
 * @param {string}                                        code
 * @param {ComponentMessage|SystemMessage|FactoryMessage} message
 * @constructor
 */
var CodeMessage = function(filename, code, message) {
    this.filename = filename;
    this.code = code;
    this.message = message;
};

module.exports = {
    Writer: Writer,
    CodeMessage: CodeMessage
};