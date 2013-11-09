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
    console.log(err);
    process.exit(1);
};

/**
 * Logs out a Component message
 * @param {ComponentMessage}  component
 * @param {boolean}          [skipped=false]
 */
Reporter.prototype.logComponent = function(component, skipped) {
    var skipMsg = (skipped) ? ' (skipped)' : '';
    console.log('Component:' + component.name + ':' + component.filename + skipMsg);
};

/**
 * Logs out a System message
 * @param {SystemMessage}  system
 * @param {boolean}       [skipped=false]
 */
Reporter.prototype.logSystem = function(system, skipped) {
    var skipMsg = (skipped) ? ' (skipped)' : '';
    console.log(system.type + ':' + system.name + ':' + system.filename + skipMsg);
};

/**
 * Logs out the Factory message
 * @param {FactoryMessage}  factory
 * @param {boolean}        [skipped=false]
 */
Reporter.prototype.logFactory = function(factory, skipped) {
    var skipMsg = (skipped) ? ' (skipped)' : '';
    console.log('Factory:factory.js' + skipMsg);
    if (!skipped) {
        for (var i = 0, len = factory.functions.length; i < len; i++) {
            var generator = factory.functions[i];
            console.log('\t' + generator.entityType + ':' + generator.functionName);
        }
    }
};

/**
 * Logs out a syntax error during the parsing phase
 * @param {SyntaxError} err
 */
Reporter.prototype.logSyntaxError = function(err) {
    console.log('Line ' + err.line + ', Column ' + err.column + ': ' + err.message);
    process.exit(1);
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
 * @param {string} name     - Name of the Component
 * @param {string} filename - Name of the file
 * @param {string} code     - Code generated for the Component
 * @constructor
 */
var ComponentMessage = function(name, filename, code) {
    this.name = name;
    this.filename = filename;
    this.code = code;
};

/**
 * Represents a single System
 * @param {string} name     - Name of the System
 * @param {string} type     - System, RenderSystem, or BehaviorSystem
 * @param {string} filename - File path
 * @param {string} code     - Code generated for the System
 * @constructor
 */
var SystemMessage = function(name, type, filename, code) {
    this.name = name;
    this.type = type;
    this.filename = filename;
    this.code = code;
};

/**
 * Represents the Factory
 * @param {GeneratorMessage[]} functions  - Functions being generated for the Factory
 * @param {string}             code       - Code generated for the Factory
 * @constructor
 */
var FactoryMessage = function(functions, code) {
    this.functions = functions;
    this.code = code;
};

/**
 * Represents a single generator function
 * @param {string} entityType   - Type of Entity to produce
 * @param {string} functionName - Name of the function
 * @param {string} code         - Code generated for the function
 * @constructor
 */
var GeneratorMessage = function(entityType, functionName, code) {
    this.entityType = entityType;
    this.functionName = functionName;
    this.code = code;
};

module.exports = {
    Reporter: Reporter,
    ComponentMessage: ComponentMessage,
    SystemMessage: SystemMessage,
    FactoryMessage: FactoryMessage,
    GeneratorMessage: GeneratorMessage
};