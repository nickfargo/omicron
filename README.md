# Zcore

## Caching

### hasOwn

`Object.prototype.hasOwnProperty`

### toString

`Object.prototype.toString`

### slice

`Array.prototype.slice`

### trim

`String.prototype.trim`

## Nothing

### noop

Returns `undefined`.

### getThis

Returns `this`.

## Typing

### type( obj )

Returns type reported by `toString`.

### isNumber( number )

### isArray( array )

### isFunction( fn )

### isPlainObject( obj )

### isEmpty( obj [, andPrototype ] )

Set `andPrototype` to something truthy and `obj` will have to be empty all the way through.

## Iterating

### each( obj, callback )

Like jQuery, with a `callback` signature of `key, value, obj`.

### forEach

Like ES5 `forEach`, with a `callback` signature of `value, key, obj`.

## Extending

### extend( [ flags, ] target, source, [ ...sourceN ] )

Like jQuery, with an option flags string.

 *     'deep' : Same as the optional Boolean flag in jQuery
 *     'own' : Restricts extended properties to those filtered by `Object.hasOwnProperty`
 *     'all' : Includes keys with undefined values

## Array/Object Composition

### flatten

Extracts elements of nested arrays.

### keys( obj )

Returns an object's keys in an ordered string array.

### invert( array )

For an `array` whose values are unique key strings, this returns an object that is a key-value inversion of `array`.

### setAll( obj, value )

Set every key in `obj` to `value`.

### nullify( obj )

Set every key in `obj` to `null`.

### nullHash( array )

Given an `array` of keys, return an object with those keys all set to `null`.

## Miscellaneous

### stringFunction( fn )

Return the function `fn`, with its `toString` method set to itself. Might break stuff, like `type`, but can be useful for, say, devtools-inspecting the value of a getter.

### valueFunction( fn )

Same as above, but for `valueOf` instead of `toString`.

### noConflict
