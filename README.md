# Zcore

Zcore **(“Z”)** is a small JavaScript library of core functions and tools that assist with:

* Object manipulation and differential operations
* Prototypal inheritance
* Selected general tasks: safe typing, functional iteration, etc.




## Installation

**Z** has no dependencies; it can be loaded straight from the source file `zcore.js`, or installed via **npm**:

```
$ npm install zcore
```

In node, **Z** will be available in the usual fashion:

```javascript
var Z = require('zcore');
```

In the browser, **Z** will add a single object `Z` to the global `window` (which can be reclaimed later using `Z.noConflict()`).

```html
<script src="zcore.js"></script>
```




## Usage example <a name="usage-example" href="#usage-example">&#x1f517;</a>

### Differential history

Consider a timeline object that efficiently stores history information. The differential functions of **Z** can be used to make this a fairly straightforward task — in the code below, look for applications of functions **delta** and **diff** in particular, as well as usage of the special **NIL** object within the `history` array:

```javascript
var Z = require('zcore');

function Timeline () {
    var NIL = Z.NIL,
        history = [
            {},
            { a: 1, b: 2 },
            { b: NIL, d: 4 },
            { a: NIL, e: 5 },
            { e: 2.718, f: 6 }
        ],
        index = 0;

    Z.assign( this, {
        history: function () {
            return Z.clone( history );
        },
        data: function () {
            return Z.clone( history[ index ] );
        },
        back: function () {
            if ( index === 0 ) return;
            var o = history[ index ];
            history[ index ] = Z.delta( o, history[ --index ] );
            return Z.clone( history[ index ] = o );
        },
        forward: function () {
            if ( index === history.length - 1 ) return;
            var o = history[ index ];
            history[ index ] = Z.delta( o, history[ ++index ] );
            return Z.clone( history[ index ] = o );
        },
        push: function ( obj ) {
            var l, n, o = history[ index ];
            history[ index ] = Z.delta( o, obj );
            history[ ++index ] = o;
            l = index + 1;
            ( n = history.length - l ) && history.splice( l, n );
            return l;
        },
        replace: function ( obj ) {
            var o = history[ index ],
                d = Z.diff( o, obj ),
                i;
            history[ index ] = obj;
            index > 0 &&
                ( history[ i = index - 1 ] = Z.diff( Z.clone( obj, d, history[i] ), obj ) );
            index < history.length - 1 &&
                ( history[ i = index + 1 ] = Z.diff( Z.clone( obj, d, history[i] ), obj ) );
            return d;
        }
    });
}
```

Using this class, and the information we’re preloading into `history`, we can freely traverse a timeline in either direction, and manipulate the history along the way. First let’s step forward:

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

The data is different, but it still records *the exact same information*. This is because the history elements are relative, and our perspective has changed after having moved `forward` four times — whereas the object initially contained the information needed to step forward in the timeline, viewing the timeline now from `index=4`, its elements instead contain the information needed to step back to the original empty object at `index=0`.

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
//   { a:1, d:4 },
//   { b:2, c:3 }
// ]

// `replace` returns the **delta** of the new element applied against the old element
t.replace( { a:4, b:3, d:1 } ); // { a:1, b:NIL, d:4 }

t.history();
// [
//   { a:NIL, b:NIL },
//   { a:1, b:2, d:NIL },
//   { a:4, b:3, d:1 },
//   { a:1, b:2, c:3, d:4 }
// ]
```




## API <a name="api" href="#api">&#x1f517;</a>

* [Meta / Cached entities](#api--meta-cached-entities)
* [Special-purpose functions and objects](#api--special-purpose-functions-and-objects)
* [Typing and inspection](#api--typing-and-inspection)
* [Iteration](#api--iteration)
* [Object manipulation and differentiation](#api--object-manipulation-and-differentiation)
* [Inheritance facilitators](#api--inheritance-facilitators)
* [Array/Object composition](#api--array-object-composition)
* [Miscellaneous](#api--miscellaneous)



### Meta / Cached entities <a name="api--meta-cached-entities" href="#api--meta-cached-entities">&#x1f517;</a>

#### VERSION

0.1.4

#### env

Environment variables.

* `server` : `true` if the environment conforms to the CommonJS module system (e.g., node.js).
* `client` : `true` in the case of a `window`ed environment (e.g. browser).
* `debug` : `false`. Changing this has no built-in effect. May be coded against by dependent libraries for their own purposes.

#### noConflict

Returns control of the global `Z` property to its original value.

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



### Special-purpose functions and objects <a name="api--special-purpose-functions-and-objects" href="#api--special-purpose-functions-and-objects">&#x1f517;</a>

#### noop

A function that returns `undefined`.

#### getThis

A function that returns `this`.

#### thunk

```javascript
Z.thunk( obj )
```

Returns a lazy evaluator function that closes over and returns the provided `obj` argument.

#### NIL

```javascript
Z.NIL
```

`NIL` is a special object used only for its unique reference. Whereas the `null` reference connotes “no object”, and `undefined` connotes “no value”, `NIL` specifically implies “no existence” of a corresponding property on some other object. The prime example is its use within [**edit**](#edit) and the related differential operation functions, where, within a given operand, a property whose value is set to `NIL` indicates the absence or deletion of the corresponding property on an associated operand.



### Typing and inspection <a name="api--typing-and-inspection" href="#api--typing-and-inspection">&#x1f517;</a>

#### type

```javascript
Z.type( obj )
```

Returns the lowercase type string as derived from `toString`.

#### isNumber

```javascript
Z.isNumber( number )
```

Returns `true` if `number` is a valid numeric value.

#### isArray

```javascript
Z.isArray( array )
```

Returns `true` if `array` is a proper `Array`.

#### isFunction

```javascript
Z.isFunction( fn )
```

Returns `true` if `fn` is a function.

#### isPlainObject

```javascript
Z.isPlainObject( obj )
```

Near identical port from jQuery. Excludes `null`, arrays, constructed objects, the global object, and DOM nodes.

#### isEmpty

```javascript
Z.isEmpty( obj, [ andPrototype ] )
```

Returns a boolean indicating whether the object or array at `obj` contains any members. For an `Object` type, if `andPrototype` evaluates to `true`, then `obj` must also be empty throughout its prototype chain.

#### isEqual

```javascript
Z.isEqual( subject, object )
```

Performs a deep equality test between two objects.

```javascript
var subject = { a:1, b:[ 'alpha', 'beta' ], c:{ d:1 } };

Z.isEqual( subject, { a:1, b:[ 'alpha', 'beta' ], c:{ d:1 } } );         // true
Z.isEqual( subject, { a:1, b:{ '1':'beta', '0':'alpha' }, c:{ d:1 } } ); // true

Z.isEqual( [1], { 0:1, 1:undefined } ); // true
Z.isEqual( { 0:1, 1:undefined }, [1] ); // false
```

#### lookup

```javascript
Z.lookup( obj, path, [ separator ] )
```

Retrieves the value at the location indicated by the provided `path` string inside a nested object `obj`.

```javascript
var x = { a: { b:42 } };
Z.lookup( x, 'a' );     // { b:42 }
Z.lookup( x, 'a.b' );   // 42
Z.lookup( x, 'a.b.c' ); // undefined
```



### Iteration

#### each

```javascript
Z.each( obj, callback )
```

Functional iterator with jQuery-style callback signature of `key, value, object`.

```javascript
Z.each( [ 'a', 'b', 'c' ], function ( index, string, array ) {
    array[ index ] = string.toUpperCase();
});
Z.each( { x:3, y:4, z:5 }, function ( axis, value, vector ) {
    vector[ axis ] = value * value;
});
```

#### forEach

```javascript
Z.forEach( obj, fn, context )
```

Functional iterator with ES5-style callback signature of `value, key, object`. If available, delegates to the native `Array.prototype.forEach` when appropriate.

```javascript
Z.forEach( [ 'a', 'b', 'c' ], function ( string, index, array ) {
    array[ index ] = string.toUpperCase();
});
Z.forEach( { x:3, y:4, z:5 }, function ( value, axis, vector ) {
    vector[ axis ] = value * value;
});
```



### Object manipulation and differentiation

#### edit

```javascript
Z.edit( [ flags ], subject, source, [ ...sourceN ] )
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
Z.edit( { a:1 }, { b:[ 'alpha', 'beta' ] } );
// { a:1, b:[ 'alpha', 'beta' ] }

Z.edit( true, { a:1, b:[ 'alpha', 'beta' ] }, { b:[ undefined, 'bravo', 'charlie' ] } );
// { a:1, b:[ 'alpha', 'beta', 'charlie' ] }

Z.edit( 'deep all', { a:1, b:[ 'alpha', 'beta' ] }, { b:[ undefined, 'bravo', 'charlie' ] } );
// { a:1, b:[ undefined, 'bravo', 'charlie' ] }
```

```javascript
var _ = undefined, NIL = Z.NIL,
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

object = Z.edit( true, {}, original );
// { b: "dos",
//   c: {
//       d: "III",
//       e: "IV"
//   },
//   f: "Foo",
//   g: [ 0, "une" ] }

deltas = Z.edit.apply( Z, [ 'deep delta', object ].concat( edits ) );
// [ { a: 1 },
//   { a: "uno", b: "2" },
//   { c: { d: 3, e: 4 } },
//   { a: "un", f: NIL },
//   { b: "deux", g: [ _, 1 ] } ]

reversion = Z.edit.apply( Z, [ true, object ].concat( deltas.reverse() ) );
// { a: 1,
//   b: "2",
//   c: {
//       d: 3,
//       e: 4
//   },
//   g: [ 0, 1 ] }

Z.isEqual( original, reversion ); // true
```

*See also:* [**clone**](#clone), [**delta**](#delta), [**diff**](#diff), [**assign**](#assign)

#### clone

```javascript
Z.clone( source, [ ...sourceN ] )
```

Creates a new object or array and deeply copies properties from all `source` operands. *See also:* [**edit**](#edit)

```javascript
var o = { a:1, b:[ 'alpha', 'beta' ], c:{ d:1 } },
    x = Z.clone( o );

o !== x;           // true
o.b !== x.b;       // true
o.b[0] === x.b[0]; // true
o.c !== x.c;       // true
o.c.d === x.c.d;   // true
```

#### delta

```javascript
Z.delta( subject, source, [ ...sourceN ] )
```

Deeply copies each `source` operand into `subject`, and returns a delta object, or an array of deltas in the case of multiple `source`s.

*See also:* [**edit**](#edit)

```javascript
var _ = undefined, NIL = Z.NIL,
    o     = { a:1, b:[ 'alpha', 'beta'             ], c:{ d:1            } },
    edit  = {      b:[ _,       'bravo', 'charlie' ], c:{ d:NIL, e:2.718 } },
    delta = Z.delta( o, edit );

o;     // { a:1, b:[ 'alpha', 'bravo', 'charlie' ], c:{ e:2.718 } }
delta; // { b:[ undefined, 'beta', NIL ], c:{ d:1, e:NIL } }

Z.edit( 'deep', o, delta ); // { a:1, b:[ 'alpha', 'beta' ], c:{ d:1 } }
```

#### diff

```javascript
Z.diff( subject, source, [ ...sourceN ] )
```

Deeply compares each `source` operand to `subject`, and returns an absolute delta, or in the case of multiple `source` operands, an array of absolute deltas. Unlike the `delta` function, `diff` leaves `subject` unaffected.

*See also:* [**edit**](#edit)

```javascript
var o = { a:1, b:[ 'alpha', 'beta'  ], c:{ d:1          } },
    x = {      b:[ 'alpha', 'bravo' ], c:{      e:2.718 } };

Z.diff( o, x ); // { a:1, b:[ undefined, 'beta' ], c:{ d:1, e:NIL } }
```

For plain objects A and B, the following expression is `true`:
```javascript
Z.isEqual( A, Z.edit( B, Z.diff( A, B ) ) )
```

#### assign

```javascript
Z.assign( [ target ], map, [ value ] )
```

Performs batch assignments of values to one or more keys of an object.

```javascript
Z.assign( { a:1 }, { b:1, 'c d e f':2, 'g h i':3 } );
// { a:1, b:1, c:2, d:2, e:2, f:2, g:3, h:3, i:3 }

Z.assign( { 'a b':1, c:2 } );
// { a:1, b:1, c:2 }

Z.assign( 'a b c', 42 );
// { a: 42, b: 42, c: 42 }

Z.assign( 'a b c' );
// { a: 'a', b: 'b', c: 'c' }
```

#### alias

```javascript
Z.alias( object, map )
```

Within `object`, copies a value from one key to one or more other keys.

```javascript
Z.alias( { a:1, c:2, g:3 }, {
    a: 'b'     
    c: 'd e f' 
    g: 'h i'   
});
// { a:1, b:1, c:2, d:2, e:2, f:2, g:3, h:3, i:3 }
```



### Inheritance facilitators <a name="api--inheritance-facilitators" href="#api--inheritance-facilitators">&#x1f517;</a>

#### inherit

```javascript
Z.inherit( child, parent, [ properties ], [ statics ] )
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

Z.inherit( Bird, Animal );
function Bird () {}
Bird.oviparous = true;
Bird.prototype.sing = function () {
    return 'tweet';
};

Z.inherit( Chicken, Bird );
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
Z.privilege( object, methodStore, map )
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

    Z.privilege( this, Class.privileged, {
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

Z.inherit( Subclass, Class );
function Subclass () {
    var myPrivateObject = { attachment: 'zero' },
        myPrivateArray = [];

    Z.privilege( this, Class.privileged, {
        'aPrivilegedMethod aSimilarMethod' : [ myPrivateObject, myPrivateArray ],
        'aDifferentMethod' : [ aPrivateFunction ]
    });
}

var c = new Class;
c.aPrivilegedMethod( 1, 2 );

var sc = new Subclass;
sc.aPrivilegedMethod( 'one', 'two' );
```



### Array/Object composition <a name="api--array-object-composition" href="#api--array-object-composition">&#x1f517;</a>

#### flatten

```javascript
Z.flatten( obj )
```

Extracts elements of nested arrays.

#### keys

```javascript
Z.keys( obj )
```

Returns an object’s keys in an ordered string array.

#### invert

```javascript
Z.invert( array )
```

For an `array` whose values are unique key strings, this returns an object that is a key-value inversion of `array`.



### Miscellaneous <a name="api--miscellaneous" href="#api--miscellaneous">&#x1f517;</a>

#### stringFunction

```javascript
Z.stringFunction( fn )
```

Cyclically references a function’s output as its own `toString` property.

#### valueFunction

```javascript
Z.valueFunction( fn )
```

Cyclically references a function’s output as its own `valueOf` property.

