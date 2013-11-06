'use strict';

var Reporter = require('../reporter.js').Reporter;

/**
 *
 * @param {boolean} failOnWarning   - If true, exit on warning
 * @param {boolean} prettyPrint     - If true, produce output in a "pretty" format
 * @constructor
 * @extends Reporter
 */
var JSONReporter = function(failOnWarning, prettyPrint) {
    Reporter.call(this, failOnWarning);
    this.prettyPrint = prettyPrint;

    this.message = {
        projectName: '',
        warnings: [],
        components: [],
        systems: [],
        factory: null
    };
};

JSONReporter.prototype = Object.create(Reporter.prototype);
JSONReporter.prototype.constructor = JSONReporter;

/**
 * Prepares a warning log
 * @param {string} warning
 * @override
 */
JSONReporter.prototype.warning = function(warning) {
    this.message.warnings.push(warning);
};

/**
 * Reports an error
 * @param {Error} err
 * @override
 */
JSONReporter.prototype.error = function(err) {
    if (this.prettyPrint) {
        console.log(JSON.stringify(err, null, 4));
    } else {
        console.log(JSON.stringify(err));
    }
    process.exit(1);
};

/**
 * Prepares a Component log
 * @param {ComponentMessage} component
 * @override
 */
JSONReporter.prototype.logComponent = function(component) {
    this.message.components.push(component);
};

/**
 * Prepares a system log
 * @param {SystemMessage} system
 * @override
 */
JSONReporter.prototype.logSystem = function(system) {
    this.message.systems.push(system);
};

/**
 * Prepares the factory log
 * @param {FactoryMessage} factory
 * @override
 */
JSONReporter.prototype.logFactory = function(factory) {
    this.message.factory = factory;
};

/**
 * Logs out the build information
 * @param {string} projectName
 * @override
 */
JSONReporter.prototype.complete = function(projectName) {
    this.message.projectName = projectName;
    if (this.prettyPrint) {
        console.log(JSON.stringify(this.message, null, 4));
    } else {
        console.log(JSON.stringify(this.message));
    }
};

module.exports = JSONReporter;