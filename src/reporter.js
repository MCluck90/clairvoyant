'use strict';

/**
 * Reports information about the build
 * By default, information is just directly output to the console
 * @param {boolean} failOnWarning   - If true, exit on warning
 * @constructor
 */
var Reporter = function(failOnWarning) {
    this.failOnWarning = failOnWarning;
};

/**
 * Logs out a warning
 * @param {string} warning
 */
Reporter.prototype.warning = function(warning) {
    console.log(warning);
    if (!this.failOnWarning) {
        process.exit(1);
    }
};

/**
 * Logs out an error
 * @param {Error} err
 */
Reporter.prototype.error = function(err) {
    throw err;
};

/**
 * Logs out a Component message
 * @param {ComponentMessage}  component
 * @param {boolean}          [skipped=false]
 */
Reporter.prototype.logComponent = function(component, skipped) {
    var skipMsg = (skipped) ? ' (skipped)' : '';
    console.log('Component: ' + component.name + ':' + component.path + skipMsg);
};

/**
 * Logs out a System message
 * @param {SystemMessage}  system
 * @param {boolean}       [skipped=false]
 */
Reporter.prototype.logSystem = function(system, skipped) {
    var skipMsg = (skipped) ? ' (skipped)' : '';
    console.log('System: ' + system.name + ':' + system.type + ':' + system.path + skipMsg);
};

/**
 * Logs out the Factory message
 * @param {FactoryMessage}  factory
 * @param {boolean}        [skipped=false]
 */
Reporter.prototype.logFactory = function(factory, skipped) {
    var skipMsg = (skipped) ? ' (skipped)' : '';
    console.log('Factory: ' + factory.path + skipMsg);
    for (var i = 0, len = factory.functions.length; i < len; i++) {
        var generator = factory.functions[i];
        console.log('\t' + generator.entityType + ':' + generator.functionName);
    }
};

/**
 * Reports when the build is complete
 * @param {string} projectName  - Name of the project that was built
 */
Reporter.prototype.complete = function(projectName) {
    console.log('\'' + projectName + '\' build completed');
};

/**
 * Represents a single Component
 * @param {string} name - Name of the Component
 * @param {string} path - File path
 * @constructor
 */
var ComponentMessage = function(name, path) {
    this.name = name;
    this.path = path;
};

/**
 * Represents a single System
 * @param {string} name - Name of the System
 * @param {string} type - System, RenderSystem, or BehaviorSystem
 * @param {string} path - File path
 * @constructor
 */
var SystemMessage = function(name, type, path) {
    this.name = name;
    this.type = type;
    this.path = path;
};

/**
 * Represents the Factory
 * @param {string}             path       - File path
 * @param {GeneratorMessage[]} functions  - Names of the functions generated
 * @constructor
 */
var FactoryMessage = function(path, functions) {
    this.path = path;
    this.functions = functions;
};

var GeneratorMessage = function(entityType, functionName) {
    this.entityType = entityType;
    this.functionName = functionName;
};

module.exports = {
    Reporter: Reporter,
    ComponentMessage: ComponentMessage,
    SystemMessage: SystemMessage,
    FactoryMessage: FactoryMessage,
    GeneratorMessage: GeneratorMessage
};