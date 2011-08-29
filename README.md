# Zcore

## Caching

### hasOwn

`Object.prototype.hasOwnProperty`. More than one geek's pet cesium atom says it's better to delegate with this (`hasOwn.call( obj, 'yada' )`) than traverse a potentially deep prototype chain the way the usual method (`obj.hasOwnProperty('yada')`) might.

### toString

`Object.prototype.toString`

### slice

`Array.prototype.slice`

### trim

`String.prototype.trim`

## Nothing

### noop

Sometimes you want to return nothing, and when you do, you'll want one unique function to do that important job just right. This is that function.

### getThis

Or sometimes you want to return next-to-nothing. Use this for nulling the implementation of a method that's meant to be chained.

## Typing

### type( obj )

A safer bet than `typeof`.

### isNumber( number )

`NaN` you gtfo.

### isArray( array )

Come here `[ you ]`.

### isFunction( fn )

One would hope.

### isPlainObject( obj )

Like the kind you make.

### isEmpty( obj [, andPrototype ] )

Set `andPrototype` to something truthy and `obj` will have to be empty all the way through.

## Iterating

### each( obj, callback )

Use it like jQuery, with a `callback` signature of `key, value, obj`.

### forEach

Use it like ES5 `forEach`, with a `callback` signature of `value, key, obj`.

## Extending

### extend( [ deep, ] target, ...sources )

Like jQuery. A total heist.

## Composing

### flatten

Empty nesting:

	wtf = [ , [ , , [ , ], [ ] ], [], [ , [ , ], [ , [ , , ], [ ] ] ] ];
	flatten( wtf ); // [ , , , , , , , , , , , , , , , ... ] or something

### keys( obj )

You're too drunk, hand them over. You'll get them back in a nice ordered array.

### invert( array )

For an `array` whose values are unique key strings, this returns an object that is a key-value inversion of `array`.

### setAll( obj, value )

Set every key in `obj` to `value`.

### nullify( obj )

Set every key in `obj` to `null`.

### nullHash( array )

Given an `array` of keys, return an object with those keys all set to `null`.

## Circling

### stringFunction( fn )

Return the function `fn`, with its `toString` method set to itself. Might break stuff, like `type`, but can be useful for, say, devtools-inspecting the value of a getter.

### valueFunction( fn )

Same as above, but for `valueOf` instead of `toString`.

## Returning

### noConflict

I beg your pardon.

## I've got investors all lined up

<img src="/zvector/zcore/blob/master/docs/images/intoxicating_aroma.jpg?raw=true" />
