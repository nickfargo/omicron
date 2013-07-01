# Omicron.js

Omicron **(“O”)** is a small JavaScript library that assists with:

* Performing differential operations on objects
* Facilitating prototypal inheritance
* Selected common tasks: browser-safe typing, functional iteration, etc.



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
            var subject;

            if ( index === 0 ) return;
            subject = history[ index ];
            history[ index ] = O.delta( subject, history[ --index ] );

            return O.clone( history[ index ] = subject );
        },

        forward: function () {
            var subject;

            if ( index === history.length - 1 ) return;
            subject = history[ index ];
            history[ index ] = O.delta( subject, history[ ++index ] );

            return O.clone( history[ index ] = subject );
        },

        push: function ( object ) {
            var subject, l, n;

            subject = history[ index ];
            history[ index ] = O.delta( subject, object );
            history[ ++index ] = subject;
            l = index + 1;
            n = history.length - l;
            if ( n ) {
                history.splice( l, n );
            }

            return l;
        },

        replace: function ( object ) {
            var i, subject, diff, clone;

            subject = history[ index ],
            diff = O.diff( subject, object );
            history[ index ] = object;

            if ( index > 0 ) {
                i = index - 1;
                clone = O.clone( object, diff, history[i] );
                history[i] = O.diff( clone, object );
            }
            if ( index < history.length - 1 ) {
                i = index + 1;
                clone = O.clone( object, diff, history[i] );
                history[i] = O.diff( clone, object );
            }

            return diff;
        }
    });
}
```

Given the information preloaded into `history`, we can freely traverse a `Timeline`, forward and backward, and manipulate its history along the way. First let’s step forward:

```javascript
var t = new Timeline;
t.data();     // >>> {}
t.forward();  // >>> { a:1, b:2 }
t.forward();  // >>> { a:1, d:4 }          // History records 'b: NIL', so key 'b' was deleted
t.forward();  // >>> { d:4, e:5 }          // Likewise, 'a: NIL' caused key 'a' to be deleted
t.forward();  // >>> { d:4, e:2.718, f:6 }
t.forward();  // >>> undefined             // End of the timeline
t.data();     // >>> { d:4, e:2.718, f:6 }
```

Note how the elements of `history` are being used to edit the data at `history[ index ]`. Note also how the special value `NIL` is used to encode that the key to which it’s assigned on the source operand should be deleted as part of the edit to the subject operand.

Next we’ll head back to where we started — but first, let’s glance back into the timeline to see how its contents have changed now that we’re positioned at the front end:

```javascript
t.history();  // >>> [
              //       { a:NIL, b:NIL },
              //       { b:2, d:NIL },
              //       { a:1, e:NIL },
              //       { e:5, f:NIL },
              //       { d:4, e:2.718, f:6 }
              //     ]
```

The data is different, but it still records the exact same information. This is because the history elements are relative, and our perspective has changed after having moved `forward` four times — whereas the object initially contained the information needed to step forward in the timeline, viewing the timeline now from `index = 4`, its elements instead contain the information needed to step back to the original empty object at `index = 0`.

Traversing backward now:

```javascript
t.back();     // >>> { d:4, e:5 }
t.back();     // >>> { a:1, d:4 }
t.back();     // >>> { a:1, b:2 }
t.back();     // >>> {}
t.back();     // >>> undefined            // Beginning of the timeline
```

And since we’ve gone back to where we started, the timeline elements will have transformed themselves to look just like they originally did:

```javascript
t.history();  // >>> [
              //       {},
              //       { a:1, b:2 },
              //       { b:NIL, d:4 },
              //       { a:NIL, e:5 },
              //       { e:2.718, f:6 }
              //     ]
```

Next, let’s try `push`ing a new element into the middle of the history:

```javascript
t.forward();  // >>> { a:1, b:2 }
t.forward();  // >>> { a:1, d:4 }
t.push( { b:2, c:3 } ); // >>> 4  (the new length; `push` drops any forward elements)
t.data();     // >>> { a:1, b:2, c:3, d:4 }

t.history();  // >>> [
              //       { a:NIL, b:NIL },
              //       { b:2, d:NIL },
              //       { b:NIL, c:NIL },
              //       { a:1, b:2, c:3, d:4 }
              //     ]
```

And finally, let’s `replace` an element, and examine its result and effects on the timeline:

```javascript
t.back();     // >>> { a:1, d:4 }

t.history();  // >>> [
              //       { a:NIL, b:NIL },
              //       { b:2, d:NIL },
              //       { a:1, d:4 }, // <---------- index
              //       { b:2, c:3 }
              //     ]

t.replace( { a:4, b:3, d:1 } );
// >>> { a:1, b:NIL, d:4 }

t.history();  // >>> [
              //       { a:NIL, b:NIL },
              //       { a:1, b:2, d:NIL },
              //       { a:4, b:3, d:1 }, // <----- index
              //       { a:1, b:2, c:3, d:4 }
              //     ]
```

Calling `replace` instates the new element at `index`, adjusts the elements ahead and behind of the current `index` to reflect the new differentials, and returns the **delta** of the new element applied against the old element.



## API


* **[Object manipulation and differentiation](#object-manipulation-and-differentiation)**
    * [`edit`](#edit), [`clone`](#clone), [`delta`](#delta), [`diff`](#diff), [`assign`](#assign), [`alias`](#alias)
* **[Inheritance](#inheritance)**
    * [`inherit`](#inherit), [`create`](#create), [`getPrototypeOf`](#getprototypeof)
* **[Typing and inspection](#typing-and-inspection)**
    * [`type`](#type), [`isNumber`](#isnumber), [`isArray`](#isarray), [`isError`](#iserror), [`isPlainObject`](#isplainobject), [`isEmpty`](#isempty), [`isEqual`](#isequal), [`has`](#has), [`lookup`](#lookup)
* **[Iteration](#iteration)**
    * [`forEach`](#foreach)
* **[Array/object composition](#array--object-composition)**
    * [`flatten`](#flatten), [`indexOf`](#indexof), [`unique`](#unique), [`keys`](#keys), [`invert`](#invert)
* **[Meta / Miscellaneous](#meta--miscellaneous)**
    * [`env`](#env), [`noConflict`](#noconflict), [`NIL`](#nil), [`noop`](#noop), [`getThis`](#getthis), [`thunk`](#thunk), [`hasOwn`](#hasown), [`toString`](#tostring), [`slice`](#slice), [`trim`](#trim), [`randomHex`](#randomhex)

* * *



### Object manipulation and differentiation

* [`edit`](#edit)
* [`clone`](#clone)
* [`delta`](#delta)
* [`diff`](#diff)
* [`assign`](#assign)
* [`alias`](#alias)

* * *

#### edit

```javascript
O.edit( [ flags ], subject, source, [ ...sourceN ] )
```

Performs a differential operation across multiple objects.

By default, `edit` returns the first object-typed argument as `subject`, to which the contents of each subsequent `source` operand are copied, in order. Optionally the first argument may be either a Boolean `deep`, or a whitespace-delimited `flags` string containing any of the following keywords:

* `deep` : If a `source` property is an object or array, a structured clone is created on `subject`.

* `own` : Excludes `source` properties filtered by `Object.hasOwnProperty`.

* `all` : Includes `source` properties with `undefined` or `NIL` values.

* `delta` : Returns an **anti-delta** object reflecting the changes made to `subject`, or if multiple `source` operands are provided, an array of anti-deltas. The anti-delta is comprised of those properties of `subject` displaced by the `edit` operation, along with keys that did not exist on `subject` prior to the `edit` operation. This can be used to record a relativistic history for an object: immediately applying a returned anti-delta array in reverse order using `edit('deep', subject, ...)` reverts `subject` to its original condition (see example below).

* `immutable` : Leaves `subject` unchanged. Useful, for example, when accompanied by the `delta` and `absolute` flags to produce a “diff” object.

* `absolute` : Processes against all properties in `subject` for each `source`, including those not contained in `source`.

Contains techniques and influences from the deep-cloning procedure of **jQuery.extend**, with which `edit` also retains a compatible interface.

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
var NIL = O.NIL,
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
    { b: "dos", g: [ undefined, "une" ] }
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
//   { b: "deux", g: [ undefined, 1 ] } ]

reversion = O.edit.apply( O, [ true, object ].concat( deltas.reverse() ) );
// { a: 1,
//   b: "2",
//   c: {
//       d: 3,
//       e: 4
//   },
//   g: [ 0, 1 ] }

O.isEqual( original, reversion ); // >>> true
```

*See also:* [**clone**](#clone), [**delta**](#delta), [**diff**](#diff), [**assign**](#assign)


#### clone

```javascript
O.clone( source, [ ...sourceN ] )
```

The `deep all` specialization of [`edit`](#edit): creates a new object or array and deeply copies properties from all `source` operands.

```javascript
var subject = { a:1, b:[ 'alpha', 'beta' ], c:{ d:1 } },
    object = O.clone( subject );

subject === object;            // >>> false
subject.b === object.b;        // >>> false
subject.b[0] === object.b[0];  // >>> true
subject.c === object.c;        // >>> false
subject.c.d === object.c.d;    // >>> true
```

*See also:* [**edit**](#edit)


#### delta

```javascript
O.delta( subject, source, [ ...sourceN ] )
```

The `deep delta` specialization of [`edit`](#edit): deeply copies each `source` operand into `subject`, and returns the **anti-delta** of the operation. In the case of multiple `source` operands, an array of anti-deltas is returned.

The returned anti-delta object records the displaced values of properties of `subject` updated or deleted as a result of the operation, and — using the [`NIL`](#nil) entity — the prior *nonexistence* of properties that were added to `subject` as a result of the operation. Performing a successive `delta` or deep-`edit` operation on `subject`, this time providing the anti-delta returned by the first operation as the `source` for the second operation, causes `subject` to be restored to its original condition.

For any plain-objects `subject` and `object`, `delta` asserts that the following function will always evaluate to `true`:

```javascript
function invariant ( subject, object ) {
    var clone = O.clone( subject ),
        delta = O.delta( subject, object ),
        edit  = O.delta( subject, delta );

    return O.isEqual( subject, clone ) && O.isEqual( object, edit );
}
```

##### Example

```javascript
var NIL       = O.NIL,
    subject   = { a:1, b:[ 'alpha',   'beta'             ], c:{ d:1        } },
    object    = {      b:[ undefined, 'bravo', 'charlie' ], c:{ d:NIL, e:2 } },
    delta     = O.delta( subject, object );

subject; // >>> { a:1, b:[ 'alpha',   'bravo', 'charlie' ], c:{      e:2   } }
delta;   // >>> {      b:[ undefined, 'beta',  NIL       ], c:{ d:1, e:NIL } }

O.edit( 'deep', subject, delta );
         // >>> { a:1, b:[ 'alpha',   'beta'             ], c:{ d:1 } }
```

*See also:* [**edit**](#edit), [**diff**](#diff)


#### diff

```javascript
O.diff( subject, source, [ ...sourceN ] )
```

The `deep absolute immutable delta` specialization of [`edit`](#edit): performs a deep comparison of each `source` operand against `subject`, and returns an absolute anti-delta, or in the case of multiple `source` operands, an array of absolute anti-deltas. Unlike the `delta` function, `diff` leaves `subject` unaffected.

For any plain objects `subject` and `object`, `diff` asserts that the following function will always evaluate to `true`:

```javascript
function invariant ( subject, object ) {
    var diff = O.diff( subject, object ),
        edit = O.edit( 'deep', object, diff );

    return O.isEqual( subject, edit );
}
```

##### Example

```javascript
var subject   = { a:1, b:[ 'alpha',   'beta'  ], c:{ d:1        } },
    object    = {      b:[ 'alpha',   'bravo' ], c:{      e:2   } };

O.diff( subject, object );
         // >>> { a:1, b:[ undefined, 'beta'  ], c:{ d:1, e:NIL } }
```

*See also:* [**edit**](#edit), [**delta**](#delta)


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

var object = {
    addEvent: function ( type, listener ) { /* ... */ },
    removeEvent: function ( type, listener ) { /* ... */ }
};
O.alias( object, {
    addEvent: 'on bind',
    removeEvent: 'off unbind'
});
object.on( /* ... */ );
```


* * *

*Return to: [**Object manipulation and differentiation**](#object-manipulation-and-differentiation)  <  [API](#api)  <  [top](#top)*

* * *



### Inheritance

* [`create`](#create)
* [`inherit`](#inherit)
* [`getPrototypeOf`](#getprototypeof)

* * *

#### create

`Object.create`, or partial shim.


#### inherit

```javascript
O.inherit( child, parent, [ properties ], [ statics ] )
```

Properly arranges the prototypal inheritance relation between a `child` constructor and a `parent` constructor, additionally copies any “static” properties of `parent` to `child`, and returns the `child`.

* `child` and `parent` are constructor functions.

* `properties` : *(optional)* an object containing properties to be added to the prototype of `child`.

* `statics` : *(optional)* is an object containing properties to be added to `child` itself.

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


#### getPrototypeOf

`Object.getPrototypeOf`, or partial shim.


* * *

*Return to: [**Inheritance**](#inheritance)  <  [API](#api)  <  [top](#top)*

* * *



### Typing and inspection

* [`type`](#type)
* [`isNumber`](#isnumber)
* [`isArray`](#isarray)
* [`isError`](#iserror)
* [`isPlainObject`](#isplainobject)
* [`isEmpty`](#isempty)
* [`isEqual`](#isequal)
* [`has`](#has)
* [`lookup`](#lookup)

* * *


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


#### isError

```javascript
O.isError( e )
```

Returns `true` if `e` is an `Error`.


#### isPlainObject

```javascript
O.isPlainObject( object )
```

Returns `false` for non-objects, `null`, arrays, constructed objects, the global object, and DOM nodes (a near-identical port from **jQuery**).

> The `isPlainObject` test is especially useful for deep-cloning routines, like those employed in the **[`edit`](#edit)**/`extend` family of functions, which pass over objects that may carry some state hidden in a constructor or similar, which cannot be cloned.


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

O.isEqual( subject, { a:1, b:[ 'alpha', 'beta' ], c:{ d:1 } } );
// >>> true
O.isEqual( subject, { a:1, b:{ '1':'beta', '0':'alpha' }, c:{ d:1 } } );
// >>> true

O.isEqual( [1], { 0:1, 1:undefined } );
// >>> true
O.isEqual( { 0:1, 1:undefined }, [1] );
// >>> false
```

#### has

```javascript
O.has( object, path, [ separator ] )
```

Retrieves the value at the location indicated by the provided `path` string inside a nested object `object`.

```javascript
var object = { a: { b:42 } };
O.has( object, 'a' );     // >>> true
O.has( object, 'a.b' );   // >>> true
O.has( object, 'a.b.c' ); // >>> false
```


#### lookup

```javascript
O.lookup( object, path, [ separator ] )
```

Retrieves the value at the location indicated by the provided `path` string inside a nested object `object`.

```javascript
var object = { a: { b:42 } };
O.lookup( object, 'a' );     // >>> { b:42 }
O.lookup( object, 'a.b' );   // >>> 42
O.lookup( object, 'a.b.c' ); // >>> undefined
```


* * *

*Return to: [**Typing and inspection**](#typing-and-inspection)  <  [API](#api)  <  [top](#top)*

* * *



### Iteration

* [`each`](#each)
* [`forEach`](#foreach)

* * *

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



### Array/Object composition

* [`flatten`](#flatten)
* [`indexOf`](#indexof)
* [`unique`](#unique)
* [`keys`](#keys)
* [`invert`](#invert)

* * *

#### flatten

```javascript
O.flatten( array )
```

* `array` : `Array`

Returns an array that contains the extracted elements of any nested arrays within `array`.

#### indexOf

```javascript
O.indexOf( array, sought, startIndex )
```

* `array` : `Array`
* `sought` : var
* [`startIndex = 0`] : number

Searches for the `sought` element within `array`, beginning at `startIndex`, and returns its index. Returns `-1` if the element is not found.

#### unique

*Alias:* **uniq**

```javascript
O.unique( array )
```

* `array` : `Array`

Returns an array that is the set of unduplicated elements of `array`.

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



### Meta / Miscellaneous

* [`env`](#env)
* [`noConflict`](#noconflict)
* [`regexp`](#regexp)
* [`NIL`](#nil)
* [`noop`](#noop)
* [`getThis`](#getthis)
* [`thunk`](#thunk)
* [`hasOwn`](#hasown)
* [`toString`](#tostring)
* [`slice`](#slice)
* [`trim`](#trim)
* [`randomHex`](#randomhex)

* * *

#### env

Environment variables.

* `server` : `true` if the environment conforms to the CommonJS module system (e.g., node.js).
* `client` : `true` in the case of a `window`ed environment (e.g. browser).
* `debug` : `false`. Changing this has no built-in effect. May be coded against by dependent libraries for their own purposes.

#### noConflict

Returns control of the global `O` property to its original value.

#### regexp

An object in which to store regular expressions for reuse.

#### NIL

```javascript
O.NIL
```

`NIL` is a special object used only for its unique reference. Whereas the `null` entity connotes “no object”, and the `undefined` value connotes “no value”, when encountered as a property value of some object, the `NIL` reference specifically implies “no existence” of a corresponding property on some other related object.

The prime example is its use within [**edit**](#edit) and the related differential operation functions, where, within a given operand, a property whose value is set to `NIL` indicates the absence of or intent to delete the corresponding property on an associated operand.

#### noop

A reusable function that returns `undefined`.

#### getThis

A reusable function that returns `this`.

#### thunk

```javascript
O.thunk( object )
```

Returns a lazy evaluator function that closes over and returns the provided `object` argument.

#### hasOwn

`Object.prototype.hasOwnProperty`

#### toString

`Object.prototype.toString`

#### slice

`Array.prototype.slice`

#### trim

`String.prototype.trim`, or shim.

#### randomHex

```javascript
O.randomHex( length )
```

Returns a random hex string of arbitrary `length`

#### valueFunction

```javascript
O.valueFunction( fn )
```

Cyclically references a function’s output as its own `valueOf` property.


* * *

*Return to: [**Meta / Miscellaneous**](#meta--miscellaneous)  <  [API](#api)  <  [top](#top)*

* * *



## About this project

* * *

*Return to: [top](#top)*

* * *

### &#x1f44b;
