Clairvoyant
===========

*Predict the future of your project!*

---

Clairvoyant is a simple language which can generate the basic boilerplate code for Psykick projects. A simple Clairvoyant file (typically ends with a .ct extension) would look something like this:

```
NameOfTheGame {
    Components {
    }

    Templates {
    }

    Systems {
    }
}
```

## Comments
C-style inline (`// like so`) comments and multi-line (`/* like so */`) comments can be inserted anywhere in a file.

## Types
Most of the standard Javascript types are supported. This includes: `null`, `true`, `false`, floating and integer numbers, strings (double and single quoted), regular expressions, arrays, and objects. Although objects are defined with a slightly different syntax (look ahead at **Components** to see what I mean).

## Blocks
Blocks are broken into 4 types: Main, Component, Template, and System. The Main block acts as the top layer for encapsulating the other blocks. It's a great place to state the name of the project. You can have an infinite number of Component, Template, and System blocks inside of your Main block in no particular order.

### Components
Component blocks are used for defining different component types. Components are defined in a JSON-like format, but choosing to use `=>` as the seperator instead of `:`. If you wanted to define a set of vector components, you could do so like this:

```
Components {
    Vector2D {
        x => 0, // This is the default value
        y => 0
    }

    Vector3D {
        x => 0,
        y => 0,
        z => 0
    }
}
```

When these are compiled, Vector2D and Vector3D Components will be defined and placed in `components/vector2d.js` and `components/vector3d.js`, respectively. The resulting code for Vector2D will look similar to this:

```javascript
'use strict';

var Component = require('psykick2d').Component,
    Helper = require('psykick2d').Helper;

/**
 * TODO: WRITE DESCRIPTION
 * @param {Object} options
 * @param {number} [options.x=0]
 * @param {number} [options.y=0]
 * @constructor
 */
var Vector2D = function(options) {
	this.NAME = 'Vector2D';

	options = Helper.defaults(options, {
		x: 0,
		y: 0
	});

	this.x = options.x;
	this.y = options.y;
};

Helper.inherit(Vector2D, Component);

module.exports = Vector2D;
```

## Templates
You have all of these Components but now you want a way to quickly put a bunch together to make an Entity. This is where Templates come in. Templates define a function (which will be in `factory.js`) which generates an Entity with a set of Components. Say, for example, we wanted to define a simple box:

```
Components {
    Rectangle {
        x => 0,
        y => 0,
        w => 0,
        h => 0
    }

    Color {
        r => 0,
        g => 0,
        b => 0
    }
}

Templates {
    // Notice that templates are defined as arrays
    // That's because they're really just a list of Components
    Box [
        Rectangle,
        Color
    ]
}
```

This will produce a function called `createBox` on the `Factory` object which creates an Entity with the `Rectangle` and `Color` components.

But when you're creating a certain type of Entity, you'll often want to set some specific kind of default values. Just do so on the Component listing! It will merge your changes with the defaults of the original definition.

```
Templates {
    Box [
        Rectangle {
            w => 10,
            h => 10
        },
        Color
    ]
}
```

Furthermore, you may find yourself with a series of similar Entities but with some slight modifications. For that, you can inherit from other templates and take on their Components and default values.

```
Templates {
    Box [
        Rectangle {
            w => 10,
            h => 10
        },
        Color
    ]

    BigBox:Box [
        Rectangle {
            w => 100,
            h => 100
        }
    ]

    RedBox:Box [
        Color {
            r => 255
        }
    ]

    BigBlueBox:BigBox [
        Color {
            b => 255
        }
    ]
}
```

## Systems
Systems are things which act upon groups on Entities, usually on each tick. Systems differ slightly between Psykick3D and Psykick2D.

* In Psykick2D, Systems are divided into RenderSystems and BehaviorSystems. RenderSystems are used in the draw phase to, well, render stuff. BehaviorSystems are used during the update phase to change the state of the World.
* Psykick3D Systems are all essentially BehaviorSystems because the rendering is handled by THREE.js. Systems

Say we wanted a System which rendered our Boxes up there:

```
Systems {
    RenderBoxes:RenderSystem {
        Components [ Rectangle, Color ]
    }
}
```

"*But Mike!*", I hear you cry, "*I already defined my Entities, why can't I use them?*" Oh don't worry your pretty little head because you can!

```
Systems {
    RenderBoxes:RenderSystem {
        // This accepts any templates you previously defined
        Entities [ Box ]
    }
}
```

This will create a file (`systems/render-boxes.js`) with code similar to the following:

```javascript
'use strict';

var RenderSystem = require('psykick2d').RenderSystem,
    Helper = require('psykick2d').psykick2d;

var RenderBoxes = function() {
	this.requiredComponents = [
		'Rectangle',
		'Color'
	];
};

Helper.inherit(RenderBoxes, RenderSystem);

/**
 * TODO: Write documentation
 * @param {CanvasRenderingContext2D} c
 */
RenderBoxes.prototype.draw = function(c) {
	for (var i = 0, len = this.drawOrder.length; i < len; i++) {
		var entity = this.drawOrder[i];
	}
};

module.exports = RenderBoxes;
```

For `BehaviorSystem`s, something similar is done but it produces an `update` function. When defining Systems for Psykick3D, omit the System inheritance:

```
Systems {
    RotateCubes {
        Entities [ Cube ]
    }
}
```

## Modules
No one wants to keep all of their code in one file. That's why you use `include` files just like you would in a C/++ style language:

```
ProjectName {
    #include "components.ct"
    #include "templates.ct"
    #include "systems.ct"
}
```

`include` statements can also be used in any files you include. WARNING: Clairvoyant does not currently check for circular dependencies. So keep an eye on that.