# Zcore

Zcore **(“Z”)** is a small JavaScript library of core functions and tools that assist with:

* General tasks: safe typing, functional iteration, etc.
* Prototypal inheritance
* Object manipulation and differential analysis




## Installation

**Z** has no dependencies; it can be loaded straight from the source file `zcore.js`, or installed via **npm**:

```
$ npm install zcore
```

In node, **Z** will be available in the usual fashion:

```javascript
var Z = require('zcore');
```

In the browser, **Z** will add a single object `Z` to the global `window` (which can be reverted later using `Z.noConflict()`).




## Usage example

### Differential history

Consider an object that efficiently stores history information. The differential functions of **Z** can be used to make this a fairly straightforward task — in the code below, look for applications of functions **delta** and **diff** in particular, as well as usage of the special **NIL** object:

```javascript
function Class () {
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

With this class, and the information already provided in `history`, we can freely traverse the timeline, both forward and back, and manipulate the history along the way. First let’s step ahead:

```javascript
var c = new Class;
c.data();    // {}
c.forward(); // { a:1, b:2 }
c.forward(); // { a:1, d:4 }              // History records 'b: NIL', so key 'b' was deleted
c.forward(); // { d:4, e:5 }              // Likewise, 'a: NIL' caused key 'a' to be deleted
c.forward(); // { d:4, e:2.718, f:6 }
c.forward(); // undefined                 // End of the timeline
c.data();    // { d:4, e:2.718, f:6 }
```

Note how the elements of `history` are being used to edit the data at `history[ index ]`. Note also how the special value `NIL` is used to encode that the key to which it’s assigned should be deleted as part of the edit.

Next we’ll head back to where we started — but first, let’s glance back into the timeline to see how its contents have changed now that we’re positioned at the front end:

```javascript
c.history();
// [
//   { a:NIL, b: NIL },
//   { b:2, d:NIL },
//   { a:1, e:NIL },
//   { e:5, f:NIL },
//   { d:4, e:2.718, f: 6 }
// ]
```

The raw data looks much different, but *the exact same history information is still recorded* — it’s simply that our perspective has changed after having moved `forward` four times. Whereas the object initially contained the information needed to step *forward* in the timeline, viewing the timeline now from `index=4`, its elements instead contain the information needed to step *back* to the original empty object at `index=0`.

```javascript
c.back();    // { d:4, e:5 }
c.back();    // { a:1, d:4 }
c.back();    // { a:1, b:2 }
c.back();    // {}
c.back();    // undefined                 // Beginning of the timeline
```

And now that we’re back at the start, the timeline elements should look just like they originally did:

```javascript
c.history();
// [
//   {},
//   { a:1, b:2 },
//   { b:NIL, d:4 },
//   { a:NIL, e:5 },
//   { e:2.718, f:6 }
// ]
```

Next, let’s `push` a new element into the middle of the history:

```javascript
c.forward(); // { a:1, b:2 }
c.forward(); // { a:1, d:4 }
c.push( { b:2, c:3 } ); // 4            // The new length; `push` drops any forward elements
c.data();    // { a:1, b:2, c:3, d:4 }

c.history();
// [
//   { a:NIL, b:NIL },
//   { b:2, d:NIL },
//   { b:NIL, c:NIL },
//   { a:1, b:2, c:3, d:4 }
// ]
```

And finally, let’s `replace` an element, and examine its result and effects on the timeline:

```javascript
c.back();    // { a:1, d:4 }
c.history();
// [
//   { a:NIL, b:NIL },
//   { b:2, d:NIL },
//   { a:1, d:4 },
//   { b:2, c:3 }
// ]

// `replace` returns the **delta** of the new element applied against the old element
c.replace( { a:4, b:3, d:1 } ); // { a:1, b:NIL, d:4 }

c.history();
// [
//   { a:NIL, b:NIL },
//   { a:1, b:2, d:NIL },
//   { a:4, b:3, d:1 },
//   { a:1, b:2, c:3, d:4 }
// ]
```

####

Naturally, one can imagine much larger data structures than these, and especially with long series of relatively small edits, where historical information is deemed valuable, differential operations like these can help minimize storage overhead and network payloads.




## API

* Meta / Cached entities
* Special-purpose functions and singletons
* Typing and inspection
* Iteration
* Object manipulation and differentiation
* Inheritance facilitators
* Array/Object composition
* Miscellaneous



### Meta / Cached entities

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



### Special-purpose functions and singletons

#### noop

Returns `undefined`.

#### getThis

Returns `this`.

#### thunk ( obj )

Returns a lazy evaluator function that will return the `obj` argument when called.

#### NIL

Singleton value object; has no utility apart from simply its existence. Commonly used by `edit` and the related differential functions, where, within a given operand, a property whose value is set to `NIL` indicates the absence or deletion of the corresponding property on an associated operand.



### Typing and inspection

#### type ( obj )

Returns the lowercase type string as derived from `toString`.

#### isNumber ( number )

Returns `true` if `number` is a valid numeric value.

#### isArray ( array )

Returns `true` if `array` is a proper `Array`.

#### isFunction ( fn )

Returns `true` if `fn` is a function.

#### isPlainObject ( obj )

Near identical port from jQuery. Excludes `null`, arrays, constructed objects, the global object, and DOM nodes.

#### isEmpty ( obj, [ andPrototype ] )

Returns a boolean indicating whether the object or array at `obj` contains any members. For an `Object` type, if `andPrototype` evaluates to `true`, then `obj` must also be empty throughout its prototype chain.

#### isEqual ( subject, object )

Performs a deep equality test between two objects.

```javascript
var subject = { a:1, b:[ 'alpha', 'beta' ], c:{ d:1 } };

Z.isEqual( subject, { a:1, b:[ 'alpha', 'beta' ], c:{ d:1 } } );         // true
Z.isEqual( subject, { a:1, b:{ '1':'beta', '0':'alpha' }, c:{ d:1 } } ); // true

Z.isEqual( [1], { 0:1, 1:undefined } ); // true
Z.isEqual( { 0:1, 1:undefined }, [1] ); // false
```

#### lookup ( obj, path, [ separator ] )

Retrieves the value at the location indicated by the provided `path` string inside a nested object `obj`.

```javascript
var x = { a: { b:42 } };
Z.lookup( x, 'a' );     // { b:42 }
Z.lookup( x, 'a.b' );   // 42
Z.lookup( x, 'a.b.c' ); // undefined
```



### Iteration

#### each ( obj, callback )

Functional iterator with jQuery-style callback signature of `key, value, object`.

```javascript
Z.each( [ 'a', 'b', 'c' ], function ( index, string, array ) {
    array[ index ] = string.toUpperCase();
});
Z.each( { x:3, y:4, z:5 }, function ( axis, value, vector ) {
    vector[ axis ] = value * value;
});
```

#### forEach ( obj, fn, context )

Functional iterator with ES5-style callback signature of `value, key, object`. If available, delegates to the native `Array.prototype.forEach` when appropriate.

```javascript
Z.forEach( [ 'a', 'b', 'c' ], function ( string, index, array ) {
    array[ index ] = string.toUpperCase();
});
Z.forEach( { x:3, y:4, z:5 }, function ( value, axis, vector ) {
    vector[ axis ] = value * value;
});
```



### Object manipulation

#### edit( [ flags ], subject, source, [ ...sourceN ] )

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

*See also:* **clone**, **delta**, **diff**, **assign**

#### clone ( source, [ ...sourceN ] )

Creates a new object or array and deeply copies properties from all `source` operands.

```javascript
var o = { a:1, b:[ 'alpha', 'beta' ], c:{ d:1 } },
    x = Z.clone( o );

o !== x;           // true
o.b !== x.b;       // true
o.b[0] === x.b[0]; // true
o.c !== x.c;       // true
o.c.d === x.c.d;   // true
```

#### delta ( subject, source, [ ...sourceN ] )

Deeply copies each `source` operand into `subject`, and returns a delta object, or an array of deltas in the case of multiple `source`s. *See also:* **edit**

```javascript
var _ = undefined, NIL = Z.NIL,
    o = { a:1, b:[ 'alpha', 'beta' ], c:{ d:1 } },
    edit = { b:[ _, 'bravo', 'charlie' ], c:{ d:NIL, e:2.718 } },
    delta = Z.delta( o, edit );

o;     // { a:1, b:[ 'alpha', 'bravo', 'charlie' ], c:{ e:2.718 } }
delta; // { b:[ undefined, 'beta', NIL ], c:{ d:1, e:NIL } }

Z.edit( 'deep', o, delta ); // { a:1, b:[ 'alpha', 'beta' ], c:{ d:1 } }
```

#### diff ( subject, source, [ ...sourceN ] )

Deeply compares each `source` operand to `subject`, and returns an absolute delta, or in the case of multiple `source` operands, an array of absolute deltas. Unlike the `delta` function, `diff` leaves `subject` unaffected. *See also:* **edit**

```javascript
var _ = undefined, NIL = Z.NIL,
    o = { a:1, b:[ 'alpha', 'beta' ], c:{ d:1 } },
    x = { b:[ 'alpha', 'bravo' ], c:{ e:2.718 } },
    diff = Z.diff( o, x );

o;    // { a:1, b:[ 'alpha', 'beta' ], c:{ d:1 } }
diff; // { a:1, b:[ undefined, 'beta' ], c:{ d:1, e:NIL } }
```

#### assign ( [ target ], map, [ value ] )

Performs batch assignments of values to one or more keys of an object.

```javascript
Z.assign( { a:1 }, { b:1, 'c d e f':2, 'g h i':3 } );
// { a:1, b:1, c:2, d:2, e:2, f:2, g:3, h:3, i:3 }

Z.assign( { 'a b':1, c:2 } );
// { a:1, b:1, c:2 }

Z.assign( 'a b c', 42 );
// { a: 42, b: 42, c: 42 }

Z.assign( 'a b c' );
// { a: true, b: true, c: true }
```

#### alias ( object, map )

Within `object`, copies a value from one key to one or more other keys.

```javascript
Z.alias( { a:1, c:2, g:3 }, {
    a: 'b'     
    c: 'd e f' 
    g: 'h i'   
});
// { a:1, b:1, c:2, d:2, e:2, f:2, g:3, h:3, i:3 }
```



### Inheritance facilitators

#### inherit ( child, parent, [ properties ], [ statics ] )

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

#### privilege ( object, methodStore, map )

Generates partially applied functions for use as methods on an `object`.

Functions sourced from `methodStore` accept as arguments the set of variables to be closed over, and return the enclosed function that will become the `object`’s method.

The `map` argument maps a space-delimited set of method names to an array of free variables. These variables are passed as arguments to each of the named methods as found within `methodStore`.

This approach promotes reuse of a method’s logic by decoupling the function from the native scope of its free variables. A subsequent call to `privilege`, then, can be used on behalf of a distinct (though likely related) `object` to generate methods that are identical but closed over a distinct set of variables.

A limitation of this technique is the fact that, since partially applied values are copied when passed as arguments, there is no direct way for the external privileged method to change a value held within the constructor. In this case, one workaround is to provide a setter function that is scoped within the constructor; another alternative is simply to contain any desired “privileged” values as properties of a private object.

```javascript
function Class () {
    var aPrivateObject = { attachment: 0 },
        aPrivateArray = [];

    Z.privilege( this, Class.privileged, {
        aPrivilegedMethod: [ aPrivateObject, aPrivateArray ]
    });
}
Class.privileged = {
    aPrivilegedMethod: function ( thePrivateObject, thePrivateArray ) {
        function theActualMethod ( arg1, arg2 ) {
            thePrivateObject.attachment = arg1;
            thePrivateArray.push( arg2 );
        }
        return theActualMethod;
    }
}

Z.inherit( Subclass, Class );
function Subclass () {
    var myPrivateObject = { attachment: 'zero' },
        myPrivateArray = [];

    Z.privilege( this, Class.privileged, {
        aPrivilegedMethod: [ myPrivateObject, myPrivateArray ]
    });
}

var c = new Class;
c.aPrivilegedMethod( 1, 2 );

var sc = new Subclass;
sc.aPrivilegedMethod( 'one', 'two' );
```



### Array/Object composition

#### flatten

Extracts elements of nested arrays.

#### keys ( obj )

Returns an object’s keys in an ordered string array.

#### invert ( array )

For an `array` whose values are unique key strings, this returns an object that is a key-value inversion of `array`.



### Miscellaneous

#### stringFunction ( fn )

Cyclically references a function’s output as its own `toString` property.

#### valueFunction ( fn )

Cyclically references a function’s output as its own `valueOf` property.

