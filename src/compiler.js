'use strict';

var Report = require('./reporter.js'),
    ComponentMessage = Report.ComponentMessage,
    SystemMessage = Report.SystemMessage,
    FactoryMessage = Report.FactoryMessage,
    GeneratorMessage = Report.GeneratorMessage,
    util = require('./util.js'),
    extend = require('xtend');


/**
 * Generates a filename based on the class name given
 * @param {string} className
 * @returns {string}
 */
function generateFileName(className) {
    return className
        .replace(/component/gi, '')
        .replace(/system/gi, '')
        .replace('2D', '2d')
        .replace('3D', '3d')
        .replace(/^[A-Z]/, function(c) {
            return c.toLowerCase();
        })
        .replace(/[A-Z]/g, function(c) {
            return '-' + c.toLowerCase();
        }) + '.js';
}

/**
 * Compiles the AST into actual code
 * @param {AST}      ast
 * @param {Reporter} reporter
 * @param {string}   version
 * @constructor
 */
var Compiler = function(ast, reporter, version) {
    this.ast = ast;
    this.reporter = reporter;
    this.psykickVersion = 'psykick' + version;

    // Store the Templates so the Systems can access them later
    this._templatesByName = {};
};

Compiler.prototype.compile = function() {
    // Make sure that the Systems are compiled after the Factory
    // that way they have access to the Templates
    var components = this.compileComponents(this.ast.components),
        factory = this.compileFactory(this.ast.templates),
        systems = this.compileSystems(this.ast.systems);
    return {
        components: components,
        factory: factory,
        systems: systems
    };
};

/**
 * Generates the code for each of the Components
 * @param {Component[]} components
 * @returns {ComponentMessage[]}
 */
Compiler.prototype.compileComponents = function(components) {
    var componentMessages = [];

    for (var i = 0, len = components.length; i < len; i++) {
        var component = components[i],
            constructorCode = [],
            initCode = util.generateInitializerCode(component.properties);

        // Require the Component and Helper modules
        constructorCode.push(util.generateRequireStatements([
            {
                name: 'Component',
                baseModule: this.psykickVersion,
                moduleAttribute: 'Component'
            },
            {
                name: 'Helper',
                baseModule: this.psykickVersion,
                moduleAttribute: 'Helper'
            }
        ]) + '\n'); // Add an extra break for readability

        // Generate basic documentation
        constructorCode.push(util.generateDocCode({
            constructor: true
        }, component.properties));

        // Put together the constructor
        constructorCode.push('var ' + component.name + ' = function(options) {');
        constructorCode.push('\tthis.NAME = \'' + component.name + '\';\n');
        constructorCode.push(initCode); // Initializes the member properties
        constructorCode.push('};');

        // Handle the inheritance and exporting
        constructorCode.push('\n' + util.generateInheritanceCode(component.name, 'Component'));
        constructorCode.push('\n' + util.generateExportsCode(component.name));

        componentMessages.push(new ComponentMessage(
            component.name,
            generateFileName(component.name),
            constructorCode.join('\n')
        ));
    }

    return componentMessages;
};

/**
 * Generates the code for each of the Systems
 * @param {System[]} systems
 * @returns {SystemMessage[]}
 */
Compiler.prototype.compileSystems = function(systems) {
    var systemMessages = [],
        templatesByName = this._templatesByName;

    for (var i = 0, len = systems.length; i < len; i++) {
        var system = systems[i],
            requiredModuleCode = [],
            systemCode = ['var ' + system.name + ' = function() {'],
            requiredComponents = [],
            inheritanceCode = [],
            onTickCode = [];

        if (this.psykickVersion === 'psykick3d') {
            requiredModuleCode.push(util.generateRequireStatements([
                {
                    name: 'System',
                    baseModule: 'psykick3d',
                    moduleAttribute: 'System'
                },
                {
                    name: 'Helper',
                    baseModule: 'psykick3d',
                    moduleAttribute: 'Helper'
                }
            ]));
            inheritanceCode.push(util.generateInheritanceCode(system.name, 'System'));

            onTickCode = [
                '/**',
                ' * TODO: Write documentation',
                ' * @param {number} delta - Time since last update',
                ' */',
                system.name + '.prototype.update = function(delta) {',
                    '\tfor (var i = 0, len = this.actionOrder.length; i < len; i++) {',
                        '\t\tvar entity = this.actionOrder[i];',
                    '\t}',
                '};\n'
            ];

            // We don't bother with inheritance in Psykick3D, son
            if (system.parent !== null) {
                this.reporter.warning('Ignoring system inheritance on \'' + system.name + '\'');
            }
        } else if (system.parent !== null) {
            if (system.parent === 'RenderSystem' || system.parent === 'BehaviorSystem') {
                requiredModuleCode.push(util.generateRequireStatements([
                    {
                        name: system.parent,
                        baseModule: 'psykick2d',
                        moduleAttribute: system.parent
                    },
                    {
                        name: 'Helper',
                        baseModule: 'psykick2d',
                        moduleAttribute: 'psykick2d'
                    }
                ]));
                inheritanceCode.push(util.generateInheritanceCode(system.name, system.parent));

                if (system.parent === 'RenderSystem') {
                    // Each RenderSystem should have a 'draw' function
                    onTickCode = [
                        '/**',
                        ' * TODO: Write documentation',
                        ' * @param {CanvasRenderingContext2D} c',
                        ' */',
                        system.name + '.prototype.draw = function(c) {',
                            '\tfor (var i = 0, len = this.drawOrder.length; i < len; i++) {',
                                '\t\tvar entity = this.drawOrder[i];',
                            '\t}',
                        '};\n'
                    ];
                } else {
                    // Each BehaviorSystem should have an 'update' function
                    onTickCode = [
                        '/**',
                        ' * TODO: Write documentation',
                        ' * @param {number} delta - Time since last update',
                        ' */',
                        system.name + '.prototype.update = function(delta) {',
                            '\tfor (var i = 0, len = this.actionOrder.length; i < len; i++) {',
                                '\t\tvar entity = this.actionOrder[i];',
                            '\t}',
                        '};\n'
                    ];
                }
            } else {
                throw new SyntaxError('Expected \'RenderSystem\' or \'BehaviorSystem\' but got \'' +
                    system.parent + '\'');
            }
        }

        // Only adds on \n when we join it all at the end
        requiredModuleCode.push('');
        inheritanceCode.push('');

        // If the system was defined by it's Components, use those
        if (system.properties.type === 'ComponentList') {
            requiredComponents = system.properties.components;
        } else {
            // Otherwise, extract them from the templates
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

        // Every System must define which Components it needs
        if (requiredComponents.length === 0) {
            this.reporter.error(
                new SyntaxError('System \'' + system.name +'\' does not have required components or entities')
            );
            continue;
        }

        // Prepare the list of required components
        systemCode.push('\tthis.requiredComponents = [');
        for (var j = 0, numOfComponents = requiredComponents.length; j < numOfComponents; j++) {
            var separator = (j < numOfComponents - 1) ? '\',' : '\'';
            systemCode.push('\t\t\'' + requiredComponents[j] + separator);
        }
        systemCode.push('\t];');
        systemCode.push('};\n');

        var exportCode = [util.generateExportsCode(system.name)];

        systemMessages.push(new SystemMessage(
            system.name,
            system.parent,
            generateFileName(system.name),
            requiredModuleCode.concat(systemCode)
                .concat(inheritanceCode)
                .concat(onTickCode)
                .concat(exportCode)
                .join('\n')
        ));
    }

    return systemMessages;
};

/**
 * Generates the code the the Factory
 * @param {Template[]} templates
 * @returns {FactoryMessage}
 */
Compiler.prototype.compileFactory = function(templates) {
    var generatorMessages = [],
        templatesByName = this._templatesByName,
        requiredComponents = {},
        requiredModules = [
            {
                name: 'World',
                baseModule: this.psykickVersion,
                moduleAttribute: 'World'
            }
        ],
        factoryCode = [];

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
        tmplFunctionCode = tmplFunctionCode.join('\n');

        generatorMessages.push(new GeneratorMessage(
            template.name,
            'create' + template.name,
            tmplFunctionCode)
        );

        if (i < len - 1) {
            var lastIndex = tmplFunctionCode.length - 1;
            tmplFunctionCode = tmplFunctionCode.substr(0, lastIndex) + ',\n';
        }

        factoryCode.push(tmplFunctionCode);
    }

    for (var componentName in requiredComponents) {
        requiredModules.push({
            name: componentName,
            baseModule: requiredComponents[componentName]
        });
    }

    factoryCode = util.generateRequireStatements(requiredModules) +
                  'var Factory = {\n' +
                  factoryCode.join('\n') +
                  '};\n\n' +
                  'module.exports = Factory';

    return new FactoryMessage(generatorMessages, factoryCode);
};

module.exports = Compiler;

/**
 * @name AST
 * @type {{
 *  type: string,
 *  name: string,
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