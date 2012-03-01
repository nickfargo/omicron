# Zcore

## API



### Metadata

#### VERSION

0.1.4

#### env

Environment variables.

* `server` : `true` if the environment conforms to the CommonJS module system (e.g., node.js).
* `client` : `true` in the case of a `window`ed environment (e.g. browser).
* `debug` : `false`. Changing this has no built-in effect. May be coded against by dependent libraries for their own purposes.

#### regexp

Regular expression store.

#### noConflict



### Cached entities

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

#### NIL

Has no utility apart from simply its existence. Commonly used by `edit` and the related differential functions, where an object with a property whose value is set to `NIL` indicates the absence or deletion of the corresponding property on an associated method.

#### noop

Returns `undefined`.

#### getThis

Returns `this`.

#### thunk ( obj )

Returns a lazy evaluator function that will return the `obj` argument when called.


### Typing and inspection

#### type ( obj )

Returns the lowercase type string as derived from `toString`.

#### isNumber ( number )

#### isArray ( array )

#### isFunction ( fn )

#### isPlainObject ( obj )

Near identical port from jQuery. Excludes `null`, arrays, constructed objects, the global object, and DOM nodes.

#### isEmpty ( obj [, andPrototype ] )

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


### Iteration

#### each ( obj, callback )

Functional iterator with jQuery-style callback signature of `key, value, object`.

#### forEach ( obj, fn, context )

Functional iterator with ES5-style callback signature of `value, key, object`.



### Object manipulation

#### lookup ( obj, path [, separator ] )

Retrieves the value at the location indicated by the provided `path` string inside a nested object `obj`.

```javascript
var x = { a: { b:42 } };
Z.lookup( x, 'a' );     // { b:42 }
Z.lookup( x, 'a.b' );   // 42
Z.lookup( x, 'a.b.c' ); // undefined
```

#### edit( [ flags, ] subject, source [, ...sourceN ] )

Performs a differential operation across multiple objects.

By default, `edit` returns the first object-typed argument as `subject`, to which the contents of each subsequent `source` argument are copied, in order. Optionally the first argument may be either a Boolean `deep`, or a whitespace-delimited `flags` String containing any of the following keywords:

* `deep` : If a `source` property is an object or array, a structured clone is created on
     `subject`.

* `own` : Excludes `source` properties filtered by `Object.hasOwnProperty`.

* `all` : Includes `source` properties with undefined values.

* `delta` : Returns the **delta**, a structured object that reflects the changes made to the properties of `subject`. If multiple object arguments are provided, an array of deltas is returned. (Applying the deltas in reverse order in an `edit('deep')` on `subject` would revert the contents of `subject` to their original state.)

* `immutable` : Leaves `subject` unchanged. Useful in certain applications where idempotence is desirable, such as when accompanied by the `delta` and `absolute` flags to produce a “diff” object.

* `absolute` : Processes against all properties in `subject` for each `source`, including those not contained in `source`.

Contains techniques and influences from the deep-cloning procedure of **jQuery.extend**, with
which `edit` also retains a compatible API.

*Alias:* **extend**

```javascript
var original, edits, object, deltas, reversion;

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

#### clone ( source [, ...sourceN ] )

Creates a new object or array and deeply copies properties from all `source` arguments.

```javascript
var o = { a:1, b:[ 'alpha', 'beta' ], c:{ d:1 } },
    x = Z.clone( o );

o !== x;           // true
o.b !== x.b;       // true
o.b[0] === x.b[0]; // true
o.c !== x.c;       // true
o.c.d === x.c.d;   // true
```

#### delta ( subject, source [, ...sourceN ] )

Deeply copies each `source` argument into `subject`, and returns a delta object, or an array of deltas in the case of multiple `source`s.

```javascript
var _ = undefined, NIL = Z.NIL,
    o = { a:1, b:[ 'alpha', 'beta' ], c:{ d:1 } },
    edit = { b:[ _, 'bravo', 'charlie' ], c:{ d:NIL, e:2.718 } },
    delta = Z.delta( o, edit );

o;     // { a:1, b:[ 'alpha', 'bravo', 'charlie' ], c:{ e:2.718 } }
delta; // { b:[ undefined, 'beta', NIL ], c:{ d:1, e:NIL } }

Z.edit( 'deep', o, delta ); // { a:1, b:[ 'alpha', 'beta' ], c:{ d:1 } }
```

#### diff ( subject, source [, ...sourceN ] )

Deeply compares each `source` argument object to `subject`, and returns an absolute delta, or array of absolute deltas in the case of multiple `source`s. (Unlike the `delta` function, `diff` leaves `subject` unaffected.)

```javascript
var _ = undefined, NIL = Z.NIL,
    o = { a:1, b:[ 'alpha', 'beta' ], c:{ d:1 } },
    x = { b:[ 'alpha', 'bravo' ], c:{ e:2.718 } },
    diff = Z.diff( o, x );

o;    // { a:1, b:[ 'alpha', 'beta' ], c:{ d:1 } }
diff; // { a:1, b:[ undefined, 'beta' ], c:{ d:1, e:NIL } }
```

#### assign ( [ target, ] map, value )

Performs batch assignments of values to one or more keys of an object.

```javascript
Z.assign( { a:1 }, { b:1, 'c d e f':2, 'g h i':3 } );
// { a:1, b:1, c:2, d:2, e:2, f:2, g:3, h:3, i:3 }

Z.assign( { 'a b':1, c:2 } );
// { a:1, b:1, c:2 }

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

#### inherit ( child, parent, properties, statics )

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


### Array/Object Composition

#### flatten

Extracts elements of nested arrays.

#### keys( obj )

Returns an object’s keys in an ordered string array.

#### invert( array )

For an `array` whose values are unique key strings, this returns an object that is a key-value inversion of `array`.



### Miscellaneous

#### stringFunction( fn )

Cyclically references a function’s output as its own `toString` property.

#### valueFunction( fn )

Cyclically references a function’s output as its own `valueOf` property.

