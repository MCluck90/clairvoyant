'use strict';

var util = require('./util.js'),
    componentCode = [],
    templateCode = [],
    systemCode = [],
    use3D;

function generateFileName(className) {
    return className
        .replace(/component/gi, '')
        .replace(/system/gi, '')
        .replace(/^[A-Z]/, function(c) {
            return c.toLowerCase();
        })
        .replace(/[A-Z]/g, function(c) {
            return '-' + c.toLowerCase();
        }) + '.js';
}

function compile(ast, usingPsykick3D) {
    use3D = !!usingPsykick3D;
    //console.log(JSON.stringify(ast, null, 4));
    componentCode = generateComponents(ast.components);
    //templateCode = generateTemplates(ast.templates);
    //systemCode = generateSystems(ast.systems);

    componentCode.forEach(function(node) {
        console.log('>> ' + node.name);
        console.log('File: ' + node.filename);
        console.log(node.code);
        console.log('');
    });
}

function generateComponents(components) {
    var code = [];

    for (var i = 0, len = components.length; i < len; i++) {
        var component = components[i],
            constructorCode = [],
            initCode = util.generateInitializerCode(component.properties);

        constructorCode.push('var ' + component.name + ' = function(options) {');
        constructorCode.push(initCode);
        constructorCode.push('};');

        code.push({
            name: component.name,
            filename: generateFileName(component.name),
            code: constructorCode.join('\n')
        });

    }


    return code;
}

function generateTemplates(templates) {

}

function generateSystems(systems) {

}

module.exports = {
    compile: compile,
    getComponents: function() {
        return components.slice(0);
    },
    getTemplates: function() {
        return templates.slice(0);
    },
    getSystems: function() {
        return systems.slice(0);
    }
};