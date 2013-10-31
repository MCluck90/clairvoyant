'use strict';

var util = require('./util.js'),
    extend = require('xtend'),
    fs = require('fs'),
    path = require('path'),
    relativeTo = function(p) {
        return path.resolve(process.cwd(), p);
    },
    componentCode = [],
    componentsByName = {},
    templateCode = [],
    templatesByName = {},
    systemCode = [],
    gameName = '',
    psykickVersion = 'psykick2d';

function generateFolderName(f) {
    return f
        .replace(/component/gi, '')
        .replace(/system/gi, '')
        .replace(/^[A-Z]/, function(c) {
            return c.toLowerCase();
        })
        .replace(/[A-Z]/g, function(c) {
            return '-' + c.toLowerCase();
        });
}

/**
 * Generates a filename based on the class name given
 * @param {string} className
 * @returns {string}
 */
function generateFileName(className) {
    return generateFolderName(className) + '.js';
}

/**
 * Compile the components/templates/systems from the AST
 * @param ast
 * @param usingPsykick3D
 */
function compile(ast, usingPsykick3D) {
    if (usingPsykick3D) {
        psykickVersion = 'psykick3d';
    }

    gameName = ast.name;
    componentCode = generateComponents(ast.components);
    templateCode = generateTemplates(ast.templates);
    systemCode = generateSystems(ast.systems);
}

function save(rootFolder) {
    if (gameName === '') {
        throw new Error('Code must first by compiled before saving');
    }

    // Create the folder structure
    rootFolder = relativeTo(rootFolder);
    var componentsFolder = path.resolve(rootFolder, 'components'),
        systemsFolder = path.resolve(rootFolder, 'systems');

    try {
        fs.mkdirSync(rootFolder);
    } catch(e) {}
    try {
        fs.mkdirSync(componentsFolder);
    } catch(e) {}
    try {
        fs.mkdirSync(systemsFolder);
    } catch(e) {}

    for (var i = 0, len = componentCode.length; i < len; i++) {
        (function(component) {
            fs.writeFile(path.resolve(componentsFolder, component.filename), component.code, function(err) {
                if (err) {
                    throw err;
                }

                console.log('Created components/' + component.filename);
            });
        })(componentCode[i]);
    }

    for (var i = 0, len = systemCode.length; i < len; i++) {
        (function(system) {
            fs.writeFile(path.resolve(systemsFolder, system.filename), system.code, function(err) {
                if (err) {
                    throw err;
                }

                console.log('Created systems/' + system.filename);
            });
        })(systemCode[i]);
    }

    // Generate the factory code
    var factoryCode = [templateCode.requireStatements];
    factoryCode.push('var Factory = {');
    for (var i = 0, len = templateCode.factoryCode.length; i < len; i++) {
        var separator = (i < len - 1) ? ',' : '';
        factoryCode.push(templateCode.factoryCode[i].code + separator);
    }
    factoryCode.push('};\n');
    factoryCode.push('module.exports = Factory;');

    fs.writeFile(path.resolve(rootFolder, 'factory.js'), factoryCode.join('\n'), function(err) {
        if (err) {
            throw err;
        }

        console.log('Created factory.js');
    });
}

function generateComponents(components) {
    var code = [];

    for (var i = 0, len = components.length; i < len; i++) {
        var component = components[i],
            constructorCode = [],
            initCode = util.generateInitializerCode(component.properties);

        componentsByName[component.name] = component.properties;

        constructorCode.push(util.generateRequireStatements([
            {
                name: 'Component',
                baseModule: psykickVersion,
                moduleAttribute: 'Component'
            },
            {
                name: 'Helper',
                baseModule: psykickVersion,
                moduleAttribute: 'Helper'
            }
        ]) + '\n');
        constructorCode.push(util.generateDocCode({
            constructor: true
        }, component.properties));
        constructorCode.push('var ' + component.name + ' = function(options) {');
        constructorCode.push('\tthis.NAME = \'' + component.name + '\';\n');
        constructorCode.push(initCode);
        constructorCode.push('};');
        constructorCode.push('\n' + util.generateInheritanceCode(component.name, 'Component'));
        constructorCode.push('\n' + util.generateExportsCode(component.name));

        code.push({
            name: component.name,
            filename: generateFileName(component.name),
            code: constructorCode.join('\n')
        });

    }


    return code;
}

function generateTemplates(templates) {
    var code = [],
        requiredComponents = {};

    for (var i = 0, len = templates.length; i < len; i++) {
        var template = templates[i],
            tmplFunctionCode = ['\tcreate' + template.name + ': function() {'],
            components = template.components,
            storedTemplate = {};

        // Store the templates components for easy access and "inheritance"
        for (var j = 0, numOfComponents = components.length; j < numOfComponents; j++) {
            var component = components[j];
            storedTemplate[component.name] = {
                type: 'ObjectLiteral',
                properties: component.properties
            };
        }

        if (template.parent !== null) {
            var parentTemplate = templatesByName[template.parent];
            if (!parentTemplate) {
                throw new SyntaxError('Template parent \'' + template.parent + '\' not defined');
            }

            storedTemplate = extend(parentTemplate, storedTemplate);
        }

        templatesByName[template.name] = storedTemplate;

        tmplFunctionCode.push('\t\tvar entity = World.createEntity();');
        for (var componentName in storedTemplate) {
            requiredComponents[componentName] = generateFileName(componentName);
            tmplFunctionCode.push('\t\t' +
                'entity.addComponent(new ' + componentName +
                    '(' + util.formatValue(storedTemplate[componentName], 3) + '));'
                );
        }
        tmplFunctionCode.push('\t\treturn entity;');
        tmplFunctionCode.push('\t}');
        code.push({
            name: template.name,
            code: tmplFunctionCode.join('\n')
        });
    }

    var result = {
            requireStatements: '',
            factoryCode: code
        },
        componentNames = Object.keys(requiredComponents).sort(function(a, b) {
            if (a.length < b.length) {
                return -1;
            } else if (b.length < a.length) {
                return 1;
            } else if (a < b) {
                return -1;
            } else {
                return 1;
            }
        }),
        requiredModules = [{
            name: 'World',
            baseModule: psykickVersion,
            moduleAttribute: 'World'
        }];

    for (var i = 0, len = componentNames.length; i < len; i++) {
        var name = componentNames[i];
        requiredModules.push({
            name: name,
            baseModule: './components/' + requiredComponents[name]
        });
    }

    result.requireStatements = util.generateRequireStatements(requiredModules) + '\n';

    return result;
}

function generateSystems(systems) {
    var code = [];

    for (var i = 0, len = systems.length; i < len; i++) {
        var system = systems[i],
            requiredModuleCode = [],
            systemCode = ['var ' + system.name + ' = function() {'],
            requiredComponents = [],
            inheritanceCode = [];

        if (psykickVersion === 'psykick3d') {
            requiredModuleCode.push(util.generateRequireStatements([
                {
                    name: 'System',
                    baseModule: 'psykick3d',
                    moduleAttribute: 'System'
                }
            ]));
            inheritanceCode.push(util.generateInheritanceCode(system.name, 'System'));

            if (system.parent !== null) {
                console.warn('Ignoring system inheritance on \'' + system.name + '\'');
            }
        } else if (system.parent !== null) {
            switch (system.parent) {
                case 'RenderSystem':
                    requiredModuleCode.push(util.generateRequireStatements([
                        {
                            name: 'RenderSystem',
                            baseModule: 'psykick',
                            moduleAttribute: 'RenderSystem'
                        }
                    ]));
                    inheritanceCode.push(util.generateInheritanceCode(system.name, 'RenderSystem'));
                    break;

                case 'BehaviorSystem':
                    requiredModuleCode.push(util.generateRequireStatements([
                        {
                            name: 'BehaviorSystem',
                            baseModule: 'psykick',
                            moduleAttribute: 'BehaviorSystem'
                        }
                    ]));
                    inheritanceCode.push(util.generateInheritanceCode(system.name, 'BehaviorSystem'));
                    break;

                default:
                    throw new SyntaxError('Expected \'RenderSystem\' or \'BehaviorSystem\' but got \'' +
                            system.parent + '\'');
            }
        } else {
            throw new SyntaxError('System \'' + system.name + '\' not specified as RenderSystem or BehaviorSystem');
        }

        // Only adds on \n when we join it all at the end
        requiredModuleCode.push('');
        inheritanceCode.push('');

        if (system.properties.type === 'ComponentList') {
            requiredComponents = system.properties.components;
        } else {
            var templates = system.properties.entities;
            for (var j = 0, numOfTmpls = templates.length; j < numOfTmpls; j++) {
                var templateName = templates[j];
                for (var componentName in templatesByName[templateName]) {
                    if (requiredComponents.indexOf(componentName) === -1) {
                        requiredComponents.push(componentName);
                    }
                }
            }
        }


        if (requiredComponents.length === 0) {
            throw new SyntaxError('System \'' + system.name +'\' does not have required components or entities');
        }

        systemCode.push('\tthis.requiredComponents =[');
        for (var j = 0, numOfComponents = requiredComponents.length; j < numOfComponents; j++) {
            var separator = (j < numOfComponents - 1) ? '\',' : '\'';
            systemCode.push('\t\t\'' + requiredComponents[j] + separator);
        }
        systemCode.push('\t];');
        systemCode.push('};\n');

        var exportCode = [util.generateExportsCode(system.name)];

        code.push({
            name: system.name,
            filename: generateFileName(system.name),
            code: requiredModuleCode.concat(systemCode).concat(inheritanceCode).concat(exportCode).join('\n')
        });
    }

    return code;
}

module.exports = {
    compile: compile,
    save: save,
    getComponents: function() {
        return componentCode.slice(0);
    },
    getTemplates: function() {
        return templateCode.slice(0);
    },
    getSystems: function() {
        return systemCode.slice(0);
    }
};

/**
 * @name AST
 * @type {{
 *  type: string,
 *  components: Component[],
 *  templates: Template[],
 *  systems: System[]
 * }}
 */

/**
 * @name Component
 * @type {{
 *  name: string,
 *  properties: ComponentProperty[]
 * }}
 */

/**
 * @name ComponentProperty
 * @type {{
 *  name: string,
 *  value: ValueNode
 * }}
 */

/**
 * @name Template
 * @type {{
 *  name: string,
 *  parent: ?string,
 *  components: Component[]
 * }}
 */

/**
 * @name System
 * @type {{
 *  name: string,
 *  parent: ?string,
 *  properties: ComponentList|EntityList
 * }}
 */

/**
 * @name ComponentList
 * @type {{
 *  type: "ComponentList",
 *  components: string[]
 * }}
 */

/**
 * @name EntityList
 * @type {{
 *  type: "EntityList",
 *  entities: string[]
 * }}
 */