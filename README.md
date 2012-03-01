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



### Special-purpose values and singletons

#### NIL

Has no utility apart from its own existence. Commonly used by `edit` and related functions, where an object with a property whose value is set to `NIL` indicates the absence or deletion of the corresponding property on an associated method.

#### noop

Returns `undefined`.

#### getThis

Returns `this`.



### Typing and inspection

#### type ( obj )

Returns the lowercase type string as derived from `toString`.

#### isNumber ( number )

#### isArray ( array )

#### isFunction ( fn )

#### isPlainObject ( obj )

Near identical port from jQuery. Excludes `null`, arrays, constructed objects, `window`, and DOM nodes.

#### isEmpty ( obj [, andPrototype ] )

Returns a boolean indicating whether the object or array at `obj` contains any members. For an `Object` type, if `andPrototype` evaluates to `true`, then `obj` must also be empty throughout its prototype chain.



### Iteration

#### each ( obj, callback )

Functional iterator with jQuery-style callback signature of `key, value, object`.

#### forEach ( obj, fn, context )

Functional iterator with ES5-style callback signature of `value, key, object`.



### Object manipulation

#### edit( [ flags, ] subject, source [, ...sourceN ] )

Performs a differential operation across multiple objects.

By default, `edit` returns the first object-typed argument as `subject`, to which the contents of each subsequent `source` argument are copied, in order. Optionally the first argument may be either a Boolean `deep`, or a whitespace-delimited `flags` String containing any of the following keywords:

* `deep` : If a `source` property is an object or array, a structured clone is created on
     `subject`.

* `own` : Excludes `source` properties filtered by `Object.hasOwnProperty`.

* `all` : Includes `source` properties with undefined values.

* `delta` : Returns the **delta**, a structured object that reflects the changes made to the properties of `subject`. If multiple object arguments are provided, an array of deltas is returned. (Applying the deltas in reverse order in an `edit('deep')` on `subject` would revert the contents of `subject` to their original state.)

* `immutable` : Leaves `subject` unchanged. Useful in certain applications where idempotence is desirable, such as when accompanied by the `delta` and `absolute` flags to produce a “diff“ object.

* `absolute` : Processes against all properties in `subject` for each `source`, including those not contained in `source`.

Contains techniques and influences from the deep-cloning procedure of `jQuery.extend`, with
which `edit` also retains a compatible API.

*Alias:* **extend**

*See also:* **clone**, **delta**, **diff**, **assign**

#### clone ( source [, ...sourceN ] )

Creates a new object or array and deeply copies properties from all `source` arguments.

#### delta ( subject, source [, ...sourceN ] )

Deeply copies each `source` argument into `subject`, and returns a delta object, or an array of deltas in the case of multiple `source`s.

#### diff ( subject, source [, ...sourceN ] )

Deeply compares each `source` argument object to `subject`, and returns an absolute delta, or array of absolute deltas in the case of multiple `source`s. (Unlike the `delta` function, `diff` leaves `subject` unaffected.)

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
	'b'     : 'a'
	'd e f' : 'c'
	'h i'   : 'g'
});
// { a:1, b:1, c:2, d:2, e:2, f:2, g:3, h:3, i:3 }
```

### Inheritance facilitators

#### inherit

#### privilege



### Array/Object Composition

#### flatten

Extracts elements of nested arrays.

#### keys( obj )

Returns an object's keys in an ordered string array.

#### invert( array )

For an `array` whose values are unique key strings, this returns an object that is a key-value inversion of `array`.



### Miscellaneous

#### stringFunction( fn )

Return the function `fn`, with its `toString` method set to itself. Might break stuff, like `type`, but can be useful for, say, devtools-inspecting the value of a getter.

#### valueFunction( fn )

Same as above, but for `valueOf` instead of `toString`.

