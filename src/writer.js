'use strict';

var fs = require('fs'),
    path = require('path'),
    
    COMPONENT_FOLDER = 'components',
    SYSTEM_FOLDER = 'systems',
    FACTORY_FILE = 'factory.js';

/**
 *
 * @param {object}   options
 * @param {string}   options.projectName
 * @param {string}   options.rootPath
 * @param {Reporter} options.reporter
 * @constructor
 */
var Writer = function(options) {
    this.projectName = options.projectName;
    this.rootPath = options.rootPath;
    this.reporter = options.reporter;
    this.overwrite = options.overwrite;

    this.remainingFiles = 0;
};

/**
 * Saves the code to disk
 * @param {{
 *      components: ComponentMessage[],
 *      systems: SystemMessage[],
 *      factory: FactoryMessage
 * }} code
 */
Writer.prototype.save = function(code) {
    this.remainingFiles = code.components.length +
                          code.systems.length +
                          1; // Factory

    var componentFolder = path.resolve(this.rootPath, COMPONENT_FOLDER),
        systemFolder = path.resolve(this.rootPath, SYSTEM_FOLDER);

    if (!fs.existsSync(this.rootPath)) {
        fs.mkdirSync(this.rootPath);
    }
    if (!fs.existsSync(componentFolder)) {
        fs.mkdirSync(componentFolder);
    }
    if (!fs.existsSync(systemFolder)) {
        fs.mkdirSync(systemFolder);
    }

    this.saveComponents(code.components);
    this.saveSystems(code.systems);
    this.saveFactory(code.factory);
};

/**
 * Writes the components to disk
 * @param {ComponentMessage[]} components
 */
Writer.prototype.saveComponents = function(components) {
    var self = this,
        componentFolder = path.resolve(this.rootPath, COMPONENT_FOLDER);
    for (var i = 0, len = components.length; i < len; i++) {
        (function(component) {
            var filePath = path.resolve(componentFolder, component.filename),
                writeToFile = (self.overwrite || !fs.existsSync(filePath));
            if (writeToFile) {
                fs.writeFile(filePath, component.code, function(err) {
                    if (err) {
                        self.reporter.error(err);
                    } else {
                        self.reporter.logComponent(component);
                        self.remainingFiles -= 1;
                    }
                    self.attemptComplete();
                });
            } else {
                self.reporter.logComponent(component, true);
                self.remainingFiles -= 1;
                self.attemptComplete();
            }
        })(components[i]);
    }
};

/**
 * Writes out the Systems to disk
 * @param {SystemMessage[]} systems
 */
Writer.prototype.saveSystems = function(systems) {
    var self = this,
        systemsFolder = path.resolve(this.rootPath, SYSTEM_FOLDER);
    for (var i = 0, len = systems.length; i < len; i++) {
        (function(system) {
            var filePath = path.resolve(systemsFolder, system.filename),
                writeToFile = (self.overwrite || !fs.existsSync(filePath));

            if (writeToFile) {
                fs.writeFile(filePath, system.code, function(err) {
                    if (err) {
                        self.reporter.error(err);
                    } else {
                        self.reporter.logSystem(system);
                        self.remainingFiles -= 1;
                        self.attemptComplete();
                    }
                });
            } else {
                self.reporter.logSystem(system, true);
                self.remainingFiles -= 1;
                self.attemptComplete();
            }
        })(systems[i]);
    }
};

/**
 * Writes out the Factory to disk
 * @param {FactoryMessage} factory
 */
Writer.prototype.saveFactory = function(factory) {
    var self = this,
        filePath = path.resolve(this.rootPath, FACTORY_FILE);
    if (this.overwrite || !fs.existsSync(filePath)) {
        fs.writeFile(filePath, factory.code, function(err) {
            if (err) {
                self.reporter.error(err);
            } else {
                self.reporter.logFactory(factory);
                self.remainingFiles -= 1;
                self.attemptComplete();
            }
        });
    } else {
        this.reporter.logFactory(factory, true);
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

module.exports = Writer;