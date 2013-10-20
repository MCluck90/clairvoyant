'use strict';

var Util = {
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
                        str += tabs + Util.formatValue(elements[i]) + separator;
                    }
                    str += shortTab + ']';
                }
                return str;
        }
    },
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
    generateInheritanceCode: function(derived, base) {
        return 'Helper.inherit(' + derived + ', ' + base + ');';
    },
    generateExportsCode: function(exportMe) {
        return 'module.exports = ' + exportMe + ';';
    }
};

module.exports = Util;