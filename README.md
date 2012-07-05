# Omicron

Omicron **(“O”)** is a small JavaScript library of core functions and tools that assist with:

* Object manipulation and differential operations
* Prototypal inheritance
* Selected general tasks: safe typing, functional iteration, etc.



## Contents

* **[Installation](#installation)**
* **[Usage](#usage)**
* **[API](#api)**
* **[About this project](#about-this-project)**

* * *


## Installation

**O** has no dependencies; it can be loaded straight from the source file `omicron.js`, or installed via [**npm**](http://npmjs.org/):

```
$ npm install omicron
```

In node, **O** will be available in the usual fashion:

```javascript
var O = require('omicron');
```

In the browser, **O** will add a single object `O` to the global `window` (which can subsequently be reclaimed using `O.noConflict()`).

```html
<script src="omicron.js"></script>
```



## Usage

### Example: Differential history

Consider a timeline object that efficiently stores history information. The differential functions of **O** can be used to make this a fairly straightforward task — in the code below, look for applications of functions [**delta**](#delta) and [**diff**](#diff) in particular, as well as usage of the special [**NIL**](#nil) object within the `history` array:

```javascript
var O = require('omicron');

function Timeline () {
    var NIL = O.NIL,
        history = [
            {},
            { a: 1, b: 2 },
            { b: NIL, d: 4 },
            { a: NIL, e: 5 },
            { e: 2.718, f: 6 }
        ],
        index = 0;

    O.assign( this, {
        history: function () {
            return O.clone( history );
        },
        data: function () {
            return O.clone( history[ index ] );
        },
        back: function () {
            if ( index === 0 ) return;
            var subject = history[ index ];
            history[ index ] = O.delta( subject, history[ --index ] );
            return O.clone( history[ index ] = subject );
        },
        forward: function () {
            if ( index === history.length - 1 ) return;
            var subject = history[ index ];
            history[ index ] = O.delta( subject, history[ ++index ] );
            return O.clone( history[ index ] = subject );
        },
        push: function ( object ) {
            var l, n, subject = history[ index ];
            history[ index ] = O.delta( subject, object );
            history[ ++index ] = subject;
            l = index + 1;
            ( n = history.length - l ) && history.splice( l, n );
            return l;
        },
        replace: function ( object ) {
            var subject = history[ index ],
                d = O.diff( subject, object ),
                i;
            history[ index ] = object;
            index > 0 &&
                ( history[ i = index - 1 ] = O.diff( O.clone( object, d, history[i] ), object ) );
            index < history.length - 1 &&
                ( history[ i = index + 1 ] = O.diff( O.clone( object, d, history[i] ), object ) );
            return d;
        }
    });
}
```

Given the information preloaded into `history`, we can freely traverse a `Timeline`, forward and backward, and manipulate its history along the way. First let’s step forward:

```javascript
var t = new Timeline;
t.data();    // {}
t.forward(); // { a:1, b:2 }
t.forward(); // { a:1, d:4 }              // History records 'b: NIL', so key 'b' was deleted
t.forward(); // { d:4, e:5 }              // Likewise, 'a: NIL' caused key 'a' to be deleted
t.forward(); // { d:4, e:2.718, f:6 }
t.forward(); // undefined                 // End of the timeline
t.data();    // { d:4, e:2.718, f:6 }
```

Note how the elements of `history` are being used to edit the data at `history[ index ]`. Note also how the special value `NIL` is used to encode that the key to which it’s assigned on the source operand should be deleted as part of the edit to the subject operand.

Next we’ll head back to where we started — but first, let’s glance back into the timeline to see how its contents have changed now that we’re positioned at the front end:

```javascript
t.history();
// [
//   { a:NIL, b:NIL },
//   { b:2, d:NIL },
//   { a:1, e:NIL },
//   { e:5, f:NIL },
//   { d:4, e:2.718, f:6 }
// ]
```

The data is different, but it still records the exact same information. This is because the history elements are relative, and our perspective has changed after having moved `forward` four times — whereas the object initially contained the information needed to step forward in the timeline, viewing the timeline now from `index = 4`, its elements instead contain the information needed to step back to the original empty object at `index = 0`.

Traversing backward now:

```javascript
t.back();    // { d:4, e:5 }
t.back();    // { a:1, d:4 }
t.back();    // { a:1, b:2 }
t.back();    // {}
t.back();    // undefined                 // Beginning of the timeline
```

And since we’ve gone back to where we started, the timeline elements will have transformed themselves to look just like they originally did:

```javascript
t.history();
// [
//   {},
//   { a:1, b:2 },
//   { b:NIL, d:4 },
//   { a:NIL, e:5 },
//   { e:2.718, f:6 }
// ]
```

Next, let’s try `push`ing a new element into the middle of the history:

```javascript
t.forward(); // { a:1, b:2 }
t.forward(); // { a:1, d:4 }
t.push( { b:2, c:3 } ); // 4            // The new length; `push` drops any forward elements
t.data();    // { a:1, b:2, c:3, d:4 }

t.history();
// [
//   { a:NIL, b:NIL },
//   { b:2, d:NIL },
//   { b:NIL, c:NIL },
//   { a:1, b:2, c:3, d:4 }
// ]
```

And finally, let’s `replace` an element, and examine its result and effects on the timeline:

```javascript
t.back();    // { a:1, d:4 }
t.history();
// [
//   { a:NIL, b:NIL },
//   { b:2, d:NIL },
//   { a:1, d:4 }, // <---------- index
//   { b:2, c:3 }
// ]

t.replace( { a:4, b:3, d:1 } );
// { a:1, b:NIL, d:4 }

t.history();
// [
//   { a:NIL, b:NIL },
//   { a:1, b:2, d:NIL },
//   { a:4, b:3, d:1 }, // <----- index
//   { a:1, b:2, c:3, d:4 }
// ]
```

Calling `replace` instates the new element at `index`, adjusts the elements ahead and behind of the current `index` to reflect the new differentials, and returns the **delta** of the new element applied against the old element.



## API

* [Meta / Cached entities](#meta--cached-entities)
* [Special-purpose functions and objects](#special-purpose-functions-and-objects)
* [Typing and inspection](#typing-and-inspection)
* [Iteration](#iteration)
* [Object manipulation and differentiation](#object-manipulation-and-differentiation)
* [Inheritance facilitators](#inheritance-facilitators)
* [Array/Object composition](#array--object-composition)
* [Miscellaneous](#miscellaneous)

* * *


### Meta / Cached entities

#### VERSION

0.1.6

#### env

Environment variables.

* `server` : `true` if the environment conforms to the CommonJS module system (e.g., node.js).
* `client` : `true` in the case of a `window`ed environment (e.g. browser).
* `debug` : `false`. Changing this has no built-in effect. May be coded against by dependent libraries for their own purposes.

#### noConflict

Returns control of the global `O` property to its original value.

#### regexp

Regular expression store.

#### hasOwn

`Object.prototype.hasOwnProperty`

#### toString

`Object.prototype.toString`

#### slice

`Array.prototype.slice`

#### trim

`String.prototype.trim`, or shim.

#### create

`Object.create`, or partial shim.

#### getPrototypeOf

`Object.getPrototypeOf`, or partial shim.


* * *

*Return to: [**Meta / Cached entities**](#meta--cached-entities)  <  [API](#api)  <  [top](#top)*

* * *



### Special-purpose functions and objects

#### noop

A function that returns `undefined`.

#### getThis

A function that returns `this`.

#### thunk

```javascript
O.thunk( object )
```

Returns a lazy evaluator function that closes over and returns the provided `object` argument.

#### NIL

```javascript
O.NIL
```

`NIL` is a special object used only for its unique reference. Whereas the `null` reference connotes “no object”, and `undefined` connotes “no value”, `NIL` specifically implies “no existence” of a corresponding property on some other object. The prime example is its use within [**edit**](#edit) and the related differential operation functions, where, within a given operand, a property whose value is set to `NIL` indicates the absence or deletion of the corresponding property on an associated operand.


* * *

*Return to: [**Special-purpose functions and objects**](#special-purpose-functions-and-objects)  <  [API](#api)  <  [top](#top)*

* * *



### Typing and inspection

#### type

```javascript
O.type( object )
```

Returns the lowercase type string as derived from `toString`.

#### isNumber

```javascript
O.isNumber( number )
```

Returns `true` if `number` is a valid numeric value.

#### isArray

```javascript
O.isArray( array )
```

Returns `true` if `array` is a proper `Array`.

#### isFunction

```javascript
O.isFunction( fn )
```

Returns `true` if `fn` is a function.

#### isPlainObject

```javascript
O.isPlainObject( object )
```

Near identical port from jQuery. Excludes `null`, arrays, constructed objects, the global object, and DOM nodes.

#### isEmpty

```javascript
O.isEmpty( object, [ andPrototype ] )
```

Returns a boolean indicating whether the object or array at `object` contains any members. For an `Object` type, if `andPrototype` evaluates to `true`, then `object` must also be empty throughout its prototype chain.

#### isEqual

```javascript
O.isEqual( subject, object )
```

Performs a deep equality test between two objects.

```javascript
var subject = { a:1, b:[ 'alpha', 'beta' ], c:{ d:1 } };

O.isEqual( subject, { a:1, b:[ 'alpha', 'beta' ], c:{ d:1 } } );         // true
O.isEqual( subject, { a:1, b:{ '1':'beta', '0':'alpha' }, c:{ d:1 } } ); // true

O.isEqual( [1], { 0:1, 1:undefined } ); // true
O.isEqual( { 0:1, 1:undefined }, [1] ); // false
```

#### lookup

```javascript
O.lookup( object, path, [ separator ] )
```

Retrieves the value at the location indicated by the provided `path` string inside a nested object `object`.

```javascript
var object = { a: { b:42 } };
O.lookup( object, 'a' );     // { b:42 }
O.lookup( object, 'a.b' );   // 42
O.lookup( object, 'a.b.c' ); // undefined
```


* * *

*Return to: [**Typing and inspection**](#typing-and-inspection)  <  [API](#api)  <  [top](#top)*

* * *



### Iteration

#### each

```javascript
O.each( object, callback )
```

Functional iterator with jQuery-style callback signature of `key, value, object`.

```javascript
O.each( [ 'a', 'b', 'c' ], function ( index, string, array ) {
    array[ index ] = string.toUpperCase();
});
O.each( { x:3, y:4, z:5 }, function ( axis, value, vector ) {
    vector[ axis ] = value * value;
});
```

#### forEach

```javascript
O.forEach( object, fn, context )
```

Functional iterator with ES5-style callback signature of `value, key, object`. If available, delegates to the native `Array.prototype.forEach` when appropriate.

```javascript
O.forEach( [ 'a', 'b', 'c' ], function ( string, index, array ) {
    array[ index ] = string.toUpperCase();
});
O.forEach( { x:3, y:4, z:5 }, function ( value, axis, vector ) {
    vector[ axis ] = value * value;
});
```


* * *

*Return to: [**Iteration**](#iteration)  <  [API](#api)  <  [top](#top)*

* * *



### Object manipulation and differentiation

#### edit

```javascript
O.edit( [ flags ], subject, source, [ ...sourceN ] )
```

Performs a differential operation across multiple objects.

By default, `edit` returns the first object-typed argument as `subject`, to which the contents of each subsequent `source` operand are copied, in order. Optionally the first argument may be either a Boolean `deep`, or a whitespace-delimited `flags` String containing any of the following keywords:

* `deep` : If a `source` property is an object or array, a structured clone is created on
     `subject`.

* `own` : Excludes `source` properties filtered by `Object.hasOwnProperty`.

* `all` : Includes `source` properties with undefined values.

* `delta` : Returns the **delta**, a structured object that contains the changes made to `subject`. If multiple `source` operands are provided, an array of deltas is returned. The delta can be used to store history information; immediately applying a returned delta array in reverse order using `edit('deep', subject, ...)` reverts `subject` to its original state (see example below).

* `immutable` : Leaves `subject` unchanged. Useful in certain applications where idempotence is desirable, such as when accompanied by the `delta` and `absolute` flags to produce a “diff” object.

* `absolute` : Processes against all properties in `subject` for each `source`, including those not contained in `source`.

Contains techniques and influences from the deep-cloning procedure of **jQuery.extend**, with
which `edit` also retains a compatible API.

*Alias:* **extend**

```javascript
O.edit( { a:1 }, { b:[ 'alpha', 'beta' ] } );
// { a:1, b:[ 'alpha', 'beta' ] }

O.edit( true, { a:1, b:[ 'alpha', 'beta' ] }, { b:[ undefined, 'bravo', 'charlie' ] } );
// { a:1, b:[ 'alpha', 'beta', 'charlie' ] }

O.edit( 'deep all', { a:1, b:[ 'alpha', 'beta' ] }, { b:[ undefined, 'bravo', 'charlie' ] } );
// { a:1, b:[ undefined, 'bravo', 'charlie' ] }
```

```javascript
var _ = undefined, NIL = O.NIL,
    original, edits, object, deltas, reversion;

original = {
    a: 1,
    b: '2',
    c: {
        d: 3,
        e: 4
    },
    g: [ 0, 1 ]
};
edits = [
    { a: "uno" },
    { a: "un", b: "deux" },
    { c: { d: "III", e: "IV" } },
    { a: NIL, f: "Foo" },
    { b: "dos", g: [ _, "une" ] }
];

object = O.edit( true, {}, original );
// { b: "dos",
//   c: {
//       d: "III",
//       e: "IV"
//   },
//   f: "Foo",
//   g: [ 0, "une" ] }

deltas = O.edit.apply( O, [ 'deep delta', object ].concat( edits ) );
// [ { a: 1 },
//   { a: "uno", b: "2" },
//   { c: { d: 3, e: 4 } },
//   { a: "un", f: NIL },
//   { b: "deux", g: [ _, 1 ] } ]

reversion = O.edit.apply( O, [ true, object ].concat( deltas.reverse() ) );
// { a: 1,
//   b: "2",
//   c: {
//       d: 3,
//       e: 4
//   },
//   g: [ 0, 1 ] }

O.isEqual( original, reversion ); // true
```

*See also:* [**clone**](#clone), [**delta**](#delta), [**diff**](#diff), [**assign**](#assign)

#### clone

```javascript
O.clone( source, [ ...sourceN ] )
```

Creates a new object or array and deeply copies properties from all `source` operands.

*See also:* [**edit**](#edit)

```javascript
var subject = { a:1, b:[ 'alpha', 'beta' ], c:{ d:1 } },
    object = O.clone( subject );

subject !== object;           // true
subject.b !== object.b;       // true
subject.b[0] === object.b[0]; // true
subject.c !== object.c;       // true
subject.c.d === object.c.d;   // true
```

#### delta

```javascript
O.delta( subject, source, [ ...sourceN ] )
```

Deeply copies each `source` operand into `subject`, and returns a delta object, or an array of deltas in the case of multiple `source`s.

*See also:* [**edit**](#edit)

```javascript
var NIL    = O.NIL,
    object = { a:1, b:[ 'alpha',   'beta'             ], c:{ d:1            } },
    edit   = {      b:[ undefined, 'bravo', 'charlie' ], c:{ d:NIL, e:2.718 } },
    delta  = O.delta( object, edit );

object;   // { a:1, b:[ 'alpha',   'bravo', 'charlie' ], c:{      e:2.718   } }
delta;    // {      b:[ undefined, 'beta',  NIL       ], c:{ d:1, e:NIL     } }

O.edit( 'deep', object, delta );
          // { a:1, b:[ 'alpha',   'beta'             ], c:{ d:1 } }
```

#### diff

```javascript
O.diff( subject, source, [ ...sourceN ] )
```

Deeply compares each `source` operand to `subject`, and returns an absolute delta, or in the case of multiple `source` operands, an array of absolute deltas. Unlike the `delta` function, `diff` leaves `subject` unaffected.

*See also:* [**edit**](#edit)

```javascript
var subject = { a:1, b:[ 'alpha', 'beta'  ], c:{ d:1          } },
    object  = {      b:[ 'alpha', 'bravo' ], c:{      e:2.718 } };

O.diff( subject, object ); // { a:1, b:[ undefined, 'beta' ], c:{ d:1, e:NIL } }
```

For plain objects `subject` and `object`, `diff` asserts the invariant:
```javascript
O.isEqual( subject, O.edit( object, O.diff( subject, object ) ) ) === true
```

#### assign

```javascript
O.assign( [ target ], map, [ value ] )
```

Performs batch assignments of values to one or more keys of an object.

```javascript
O.assign( { a:1 }, { b:1, 'c d e f':2, 'g h i':3 } );
// { a:1, b:1, c:2, d:2, e:2, f:2, g:3, h:3, i:3 }

O.assign( { 'a b':1, c:2 } );
// { a:1, b:1, c:2 }

O.assign( 'a b c', 42 );
// { a: 42, b: 42, c: 42 }

O.assign( 'a b c' );
// { a: 'a', b: 'b', c: 'c' }
```

#### alias

```javascript
O.alias( object, map )
```

Within `object`, copies a value from one key to one or more other keys.

```javascript
O.alias( { a:1, c:2, g:3 }, {
    a: 'b'     
    c: 'd e f' 
    g: 'h i'   
});
// { a:1, b:1, c:2, d:2, e:2, f:2, g:3, h:3, i:3 }
```


* * *

*Return to: [**Object manipulation and differentiation**](#object-manipulation-and-differentiation)  <  [API](#api)  <  [top](#top)*

* * *



### Inheritance facilitators

#### inherit

```javascript
O.inherit( child, parent, [ properties ], [ statics ] )
```

Facilitates prototypal inheritance between a `child` constructor and a `parent` constructor. In addition, `child` also inherits static members that are direct properties of `parent`.

* `child` and `parent` are constructor functions.

* `properties` *(optional)* is an object containing properties to be added to the prototype of `child`.

* `statics` *(optional)* is an object containing properties to be added to `child` itself.

```javascript
function Animal () {}
Animal.prototype.eat = function () {
    return 'om nom nom';
};

O.inherit( Bird, Animal );
function Bird () {}
Bird.oviparous = true;
Bird.prototype.sing = function () {
    return 'tweet';
};

O.inherit( Chicken, Bird );
function Chicken () {}
Chicken.prototype.sing = function () {
    return 'cluck';
};

Chicken.oviparous;   // true
var c = new Chicken;
c.eat();             // "om nom nom"
c.sing();            // "cluck"
```

#### privilege

```javascript
O.privilege( object, methodStore, map )
```

Generates partially applied functions for use as methods on an `object`.

Functions sourced from `methodStore` accept as arguments the set of variables to be closed over, and return the enclosed function that will become the `object`’s method.

The `map` argument maps a space-delimited set of method names to an array of free variables. These variables are passed as arguments to each of the named methods as found within `methodStore`.

This approach promotes reuse of a method’s logic by decoupling the function from the native scope of its free variables. A subsequent call to `privilege`, then, can be used on behalf of a distinct (though likely related) `object` to generate methods that are identical but closed over a distinct set of variables.

A limitation of this technique is the fact that, since partially applied values are copied when passed as arguments, there is no direct way for the external privileged method to change a value held within the constructor. In this case, one workaround is to provide a setter function that is scoped within the constructor; another alternative is simply to contain any desired “privileged” values as properties of a private object.

```javascript
function Class () {
    var aPrivateObject = { attachment: 0 },
        aPrivateArray = [],
        aPrivateFunction = function () {};

    O.privilege( this, Class.privileged, {
        'aPrivilegedMethod aSimilarMethod' : [ aPrivateObject, aPrivateArray ],
        'aDifferentMethod' : [ aPrivateFunction ]
    });
}
Class.privileged = {
    aPrivilegedMethod: function ( thePrivateObject, thePrivateArray ) {
        function theActualMethod ( arg1, arg2 ) {
            thePrivateObject.attachment = arg1;
            thePrivateArray.push( arg2 );
        }
        return theActualMethod;
    },
    aSimilarMethod: function ( thePrivateObject, thePrivateArray ) {
        return function () { /*...*/ };
    },
    aDifferentMethod: function ( thePrivateFunction ) {
        return function ( arg ) {
            return thePrivateFunction( arg );
        };
    }
}

O.inherit( Subclass, Class );
function Subclass () {
    var myPrivateObject = { attachment: 'zero' },
        myPrivateArray = [];

    O.privilege( this, Class.privileged, {
        'aPrivilegedMethod aSimilarMethod' : [ myPrivateObject, myPrivateArray ],
        'aDifferentMethod' : [ aPrivateFunction ]
    });
}

var c = new Class;
c.aPrivilegedMethod( 1, 2 );

var sc = new Subclass;
sc.aPrivilegedMethod( 'one', 'two' );
```


* * *

*Return to: [**Inheritance facilitators**](#inheritance-facilitators)  <  [API](#api)  <  [top](#top)*

* * *



### Array/Object composition

#### flatten

```javascript
O.flatten( object )
```

Extracts elements of nested arrays.

#### keys

```javascript
O.keys( object )
```

Returns an object’s keys in an ordered string array.

#### invert

```javascript
O.invert( array )
```

For an `array` whose values are unique key strings, this returns an object that is a key-value inversion of `array`.


* * *

*Return to: [**Array/Object composition**](#array--object-composition)  <  [API](#api)  <  [top](#top)*

* * *



### Miscellaneous

#### stringFunction

```javascript
O.stringFunction( fn )
```

Cyclically references a function’s output as its own `toString` property.

#### valueFunction

```javascript
O.valueFunction( fn )
```

Cyclically references a function’s output as its own `valueOf` property.


* * *

*Return to: [**Miscellaneous**](#miscellaneous)  <  [API](#api)  <  [top](#top)*

* * *



## About this project

* * *

*Return to: [top](#top)*

* * *

### &#x1f44b;
