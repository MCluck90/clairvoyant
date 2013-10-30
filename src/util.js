'use strict';

var Util = {
    /**
     * Formats a value into a way which makes sense in code
     * @param {ValueNode} node
     * @param {number} [depth=0]
     * @returns {string}
     */
    formatValue: function(node, depth) {
        depth = depth || 0;
        // Need these for formatting objects
        var tabs = new Array(depth + 1).join('\t'),
            shortTab = new Array(depth).join('\t');
        switch(node.type) {
            case 'NumericLiteral':
                return node.value;

            case 'StringLiteral':
                var str = node.value.replace('\'', '\\\'');
                return '\'' + str + '\'';

            case 'BooleanLiteral':
                return node.value.toString();

            case 'ObjectLiteral':
                var properties = node.properties,
                    str;
                if (properties.length === 0) {
                    str = '{}'
                } else {
                    str = '{\n'
                    for (var i = 0, len = properties.length; i < len; i++) {
                        var property = properties[i],
                            separator = (i < len - 1) ? ',\n' : '\n';
                        str += tabs + property.name + ': ' + Util.formatValue(property.value, depth + 1) + separator;
                    }
                    str += shortTab + '}';
                }
                return str;

            case 'ArrayLiteral':
                var elements = node.elements,
                    str;
                if (elements.length === 0) {
                    str = '[]';
                } else {
                    str = '[\n';
                    for (var i = 0, len = elements.length; i < len; i++) {
                        var separator = (i < len - 1) ? ',\n' : '\n';
                        str += tabs + Util.formatValue(elements[i], depth + 1) + separator;
                    }
                    str += shortTab + ']';
                }
                return str;

            default:
                throw new SyntaxError('Unknown value type: \'' + node.type + '\'');
                break;
        }
    },

    /**
     * Generates documentation for a function
     * @param options
     * @param [options.indentLevel=0]        - Level of indentation
     * @param [options.constructor=false]    - If true, mark as constructor
     * @param [options.returnType=undefined] - If set, will give a return type
     * @param properties
     */
    generateDocCode: function(options, properties) {
        options = options || {};
        options.indentLevel = options.indentLevel || 0;

        var tabs = new Array(options.indentLevel + 1).join('\t'),
            docString = [
                tabs + '/**',
                '* TODO: WRITE DESCRIPTION',
                '* @param {Object} options'
            ];

        for (var i = 0, len = properties.length; i < len; i++) {
            var property = properties[i],
                node = property.value,
                type = '*',
                defaultValue = '';

            switch (node.type) {
                case 'NumericLiteral':
                    type = 'number';
                    defaultValue = node.value;
                    break;

                case 'StringLiteral':
                    type = 'string';
                    defaultValue = '\'' + node.value.replace('\'', '\\\'') + '\'';
                    break;

                case 'BooleanLiteral':
                    type = 'boolean';
                    defaultValue = node.value.toString();
                    break;

                case 'ObjectLiteral':
                    // TODO: Produce sequential documentation
                    // Allow specification of required options?
                    type = 'object';
                    defaultValue = '{}';
                    break;

                case 'ArrayLiteral':
                    // TODO: Produce type based on what is in array and default values
                    type = 'Array';
                    defaultValue = '[]';
                    break;
            }

            docString.push('* @param {' + type + '} [options.' + property.name + '=' + defaultValue + ']');
        }

        if (options.constructor) {
            docString.push('* @constructor');
        } else if (options.returnType) {
            docString.push('* @returns {' + options.returnType + '}');
        }

        docString.push('*/');
        return docString.join('\n' + tabs + ' ');
    },

    /**
     * Generates code for basic initialization using an options object
     * and setting matching member attributes
     * @param {ValueNode[]} properties
     * @returns {string}
     */
    generateInitializerCode: function(properties) {
        var wrapperCode = '\toptions = Helper.defaults(options, {\n',
            defaultsCode = [],
            propertyCode = [];
        for (var i = 0, len = properties.length; i < len; i++) {
            var property = properties[i],
                separator = (i < len - 1) ? ',': '';
            defaultsCode.push('\t\t' + property.name + ': ' + Util.formatValue(property.value, 3) + separator);
            propertyCode.push('\tthis.' + property.name + ' = options.' + property.name + ';');
        }

        return wrapperCode + defaultsCode.join('\n') + '\n\t});\n\n' + propertyCode.join('\n');
    },

    /**
     * Generates statements for requiring any modules
     * @param {RequiredModule[]} requiredModules
     * @returns {string}
     */
    generateRequireStatements: function(requiredModules) {
        var code = 'var ';
        for (var i = 0, len = requiredModules.length; i < len; i++) {
            if (i > 0) {
                code += '    ';
            }
            var mod = requiredModules[i];
            code += mod.name + ' = require(\'' + mod.baseModule + '\')';
            if (mod.moduleAttribute) {
                code += '.' + mod.moduleAttribute;
            }
            if (i < len - 1) {
                code += ',\n';
            } else {
                code += ';';
            }
        }

        return code;
    },

    /**
     * Generates a statement to have one class inherit from another
     * @param {string} derived
     * @param {string} base
     * @returns {string}
     */
    generateInheritanceCode: function(derived, base) {
        return 'Helper.inherit(' + derived + ', ' + base + ');';
    },

    /**
     * Generates a module.exports statement
     * @param {string} exportMe
     * @returns {string}
     */
    generateExportsCode: function(exportMe) {
        return 'module.exports = ' + exportMe + ';';
    }
};

module.exports = Util;



/**
 * @name ValueNode
 * @type {{
 *  type: string,
 *  value: string|ValueNode,
 *  properties: ValueNode[],
 *  elements: ValueNode[]
 * }}
 */

/**
 * @name RequiredModule
 * @type {{
 *  name: string,
 *  baseModule: string,
 *  moduleAttribute: string
 * }}
 */