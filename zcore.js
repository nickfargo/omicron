( function ( undefined ) {

var	global = this,

	exports = {
		version: '0.1.1',
		env: {
			server: typeof module !== 'undefined' && !!( module.require && module.exports ),
			client: typeof window !== 'undefined' && window === global
		}
	},
	
	toString = exports.toString =
		Object.prototype.toString,
	
	hasOwn = exports.hasOwn =
		Object.prototype.hasOwnProperty,
	
	/** jQuery-style "trim", using native method on `String.prototype` if available. */
	trim = exports.trim =
		String.prototype.trim ?
			function ( text ) { return text == null ? '' : String.prototype.trim.call( text ); } :
			function ( text ) { return text == null ? '' : text.toString().replace( /^\s+/, '' ).replace( /\s+$/, '' ); },
	
	slice = exports.slice =
		Array.prototype.slice;


exports.noConflict = ( function () {
	var autochthon = global.Z;
	return function () {
		global.Z = autochthon;
		return this;
	};
})();

/**
 * General-purpose empty function. May also be deemed suitable as a unique alternative "nil" type for
 * strict-equal matches whenever it's desirable to avoid traditional `null` and `undefined`.
 */
function noop () {}
exports.noop = noop;

/**
 * Like `noop`, except suited for substitution on methods designed to be chainable.
 */
function getThis () { return this; }
exports.getThis = getThis;

/**
 * Calls the specified native function if it exists and returns its result; if no such function exists on
 * `obj` as registered in `__native.fn`, returns our unique `noop` (as opposed to `null` or `undefined`,
 * which may be a valid result from the native function itself).
 */
function __native ( item, obj /* , ... */ ) {
	var n = __native.fn[item];
	return n && obj[item] === n ? n.apply( obj, slice.call( arguments, 2 ) ) : noop;
}
( exports.__native = __native ).fn = {
	forEach: Array.prototype.forEach
};

/**
 * A more browser-safe alternative to `typeof`, implemented similarly to jQuery and elsewhere, which
 * checks the string output returned by a plain `toString()` call.
 */
function type ( obj ) {
	return obj == null ? String( obj ) : type.map[ toString.call( obj ) ] || 'object';
}
type.map = {};
each( 'Array Boolean Date Function Number Object RegExp String'.split(' '), function( i, name ) {
	type.map[ "[object " + name + "]" ] = name.toLowerCase();
});
exports.type = type;

/** isBoolean */
function isBoolean ( obj ) { return type( obj ) === 'boolean'; }
exports.isBoolean = isBoolean;

/** isString */
function isString ( obj ) { return type( obj ) === 'string'; }
exports.isString = isString;

/** isNumber */
function isNumber ( n ) { return !isNaN( parseFloat( n ) ) && isFinite( n ); }
exports.isNumber = isNumber;

/** isArray */
function isArray ( obj ) { return type( obj ) === 'array'; }
exports.isArray = isArray;

/** isFunction */
function isFunction ( obj ) { return type( obj ) === 'function'; }
exports.isFunction = isFunction;

/**
 * Near-straight port of jQuery `isPlainObject`
 */
function isPlainObject ( obj ) {
	var key;
	if ( !obj || type( obj ) !== 'object' || obj.nodeType || obj === global ||
		obj.constructor &&
		!hasOwn.call( obj, 'constructor' ) &&
		!hasOwn.call( obj.constructor.prototype, 'isPrototypeOf' )
	) {
		return false;
	}
	for ( key in obj ) {}
	return key === undefined || hasOwn.call( obj, key );
}
exports.isPlainObject = isPlainObject;

/**
 * Returns a boolean indicating whether the object or array at `obj` contains any members. For an
 * `Object` type, if `andPrototype` is included and truthy, `obj` must be empty throughout its
 * prototype chain as well.
 */
function isEmpty ( obj, andPrototype ) {
	var key;
	if ( isArray( obj ) && obj.length ) {
		return false;
	}
	for ( key in obj ) {
		if ( andPrototype || hasOwn.call( obj, key ) ) {
			return false;
		}
	}
	return true;
}
exports.isEmpty = isEmpty;

/**
 * jQuery-style `$.each`, with callback signature of `key, value, object`.
 */
function each ( obj, fn ) {
	if ( !obj ) { return; }
	var	key, i, l = obj.length;
	if ( l === undefined || isFunction( obj ) ) {
		for ( key in obj ) {
			if ( fn.call( obj[key], key, obj[key], obj ) === false ) {
				break;
			}
		}
	} else {
		for ( i = 0, l = obj.length; i < l; ) {
			if ( fn.call( obj[i], i, obj[i++], obj ) === false ) {
				break;
			}
		}
	}
	return obj;
}
exports.each = each;

/**
 * ES5-style `Array.prototype.forEach`, with callback signature of `value, key, object`.
 */
function forEach ( obj, fn, context ) {
	var	n, l, key, i;
	if ( obj == null ) { return; }
	if ( ( n = __native( 'forEach', obj, fn, context ) ) !== noop ) { return n; }
	if ( ( l = obj.length ) === undefined || isFunction( obj ) ) {
		for ( key in obj ) {
			if ( fn.call( context || obj[key], obj[key], key, obj ) === false ) {
				break;
			}
		}
	} else {
		for ( i = 0, l = obj.length; i < l; ) {
			if ( fn.call( context || obj[i], obj[i], i++, obj ) === false ) {
				break;
			}
		}
	}
	return obj;
}
exports.forEach = forEach;

/**
 * Based on jQuery `$.extend` method. Optional first argument may be Boolean `deep`, and may also
 * accept a `flags` String:
 *     'deep' : Same as the optional Boolean flag in jQuery
 *     'own' : Restricts extended properties to those filtered by `Object.hasOwnProperty`
 *     'all' : Includes keys with undefined values
 */
function extend () {
	var	args = slice.call( arguments ),
		t = type( args[0] ),
		flags =
			t === 'boolean' ? { deep: args.shift() } :
			t === 'string' ? splitToHash( args.shift(), ' ' ) :
			{},
		subject = args.shift() || {},
		i = 0, l = args.length,
		obj, key, value, valueIsArray, target, clone;
	
	typeof subject === 'object' || isFunction( subject ) || ( subject = {} );
	for ( ; i < l && ( obj = args[i] ) != null; i++ ) {
		for ( key in obj ) if ( !flags.own || hasOwn.call( obj, key ) ) {
			value = obj[ key ];
			if ( value === subject ) {
				continue;
			}
			if ( flags.deep && value && ( isPlainObject( value ) || ( valueIsArray = isArray( value ) ) ) ) {
				target = subject[ key ];
				if ( valueIsArray ) {
					valueIsArray = false;
					clone = target && isArray( target ) ? target : [];
				} else {
					clone = target && ( isFunction( target ) || type( target ) === 'object' ) ? target : {};
				}
				subject[ key ] = extend( keys( flags ).join(' '), clone, value );
			} else if ( flags.all || value !== undefined ) {
				subject[ key ] = value;
			}
		}
	}
	return subject;
}
exports.extend = extend;

/**
 * Extracts elements of nested arrays
 */
function flatten ( array ) {
	isArray( array ) || ( array = [ array ] );
	var	i = 0,
		l = array.length,
		item,
		result = [];
	while ( i < l ) {
		item = array[i++];
		isArray( item ) ? ( result = result.concat( flatten( item ) ) ) : result.push( item );
	}
	return result;
}
exports.flatten = flatten;

/**
 * Returns an array containing the keys of a hashmap
 */
function keys ( obj ) {
	var key, result = [];
	if ( !( isPlainObject( obj ) || isFunction( obj ) ) ) { throw new TypeError; }
	for ( key in obj ) { hasOwn.call( obj, key ) && result.push( key ); }
	return result;
}
exports.keys = keys = isFunction( Object.keys ) ? Object.keys : keys;

/**
 * Returns a hashmap that is the key-value inversion of the supplied string array
 */
function invert ( array ) {
	for ( var i = 0, l = array.length, map = {}; i < l; ) {
		map[ array[i] ] = i++;
	}
	return map;
}
exports.invert = invert;

/**
 * Sets all of an object's values to a specified value
 */
function setAll ( obj, value ) {
	for ( var i in obj ) if ( hasOwn.call( obj, i ) ) {
		obj[i] = value;
	}
	return obj;
}
exports.setAll = setAll;

/**
 * Sets all of an object's values to `null`
 */
function nullify ( obj ) {
	for ( var i in obj ) if ( hasOwn.call( obj, i ) ) {
		obj[i] = null;
	}
	return obj;
}
exports.nullify = nullify;

/**
 * Returns an object whose keys are the elements of `string.split()` and whose values are all `true`.
 */
function splitToHash ( string, delimiter, value ) {
	return setAll( invert( string.split( delimiter || (/\s+/) ) ), value !== undefined ? value : true );
}
exports.splitToHash = splitToHash;

/**
 * Lazy evaluator; returns a function that returns the enclosed argument
 */
function thunk ( obj ) {
	return function () { return obj; };
}
exports.thunk = thunk;

/**
 * Retrieves the value at the location indicated by the provided `path` string inside a
 * nested object `obj`.
 * 
 * E.g.:
 * 	var x = { a: { b: 42 } };
 *  lookup( x, 'a' ) // => { "b": 42 }
 * 	lookup( x, 'a.b' ) // => 42
 * 	lookup( x, 'a.b.c' ) // => undefined
 */
function lookup ( obj, path, separator ) {
	var cursor = obj, i = 0, l = ( path = path.split( separator || '.' ) ).length, name;
	while ( i < l && cursor != null ) {
		if ( hasOwn.call( cursor, name = path[ i++ ] ) ) {
			cursor = cursor[ name ];
		} else {
			return undefined;
		}
	}
	return cursor;
}
exports.lookup = lookup;

/**
 * Reference to or partial shim for Object.create
 */
function create ( prototype ) {
	var object, constructor = function () {};
	constructor.prototype = prototype;
	object = new constructor;
	object.__proto__ = prototype;
	object.constructor = prototype.constructor;
	return object;
}
exports.create = isFunction( Object.create ) ? ( create = Object.create ) : create;

/**
 * Prototypal inheritance facilitator
 * 
 * inherit( Function child, [ Function parent ], [ Object properties ], [ Object statics ] )
 * 
 *   * `child` and `parent` are constructor functions, such that
 *         `new child instanceof parent === true`
 *   * `child` also inherits static members that are direct properties of `parent`
 *   * `properties` is an object containing properties to be added to the prototype of `child`
 *   * `statics` is an object containing properties to be added to `child` itself.
 */
function inherit ( child, parent, properties, statics ) {
	isFunction( parent ) ?
		( ( extend( child, parent ).prototype = create( parent.prototype ) ).constructor = child ) :
		( statics = properties, properties = parent );
	properties && extend( child.prototype, properties );
	statics && extend( child, statics );
	return child;
}
exports.inherit = inherit;

/**
 * Returns an object's prototype. In environments without native support, this may only work if
 * the object's constructor and its prototype are properly associated, e.g., as facilitated by
 * the `create` function.
 */
function getPrototypeOf ( obj ) {
	return obj.__proto__ || obj.constructor.prototype;
}
exports.getPrototypeOf = isFunction( Object.getPrototypeOf ) ?
	( getPrototypeOf = Object.getPrototypeOf ) : getPrototypeOf;

/**
 * Produces a hashmap whose keys are the supplied string array, with values all set to `null`
 */
function nullHash( keys ) { return nullify( invert( keys ) ); }
exports.nullHash = nullHash;

/**
 * Mirrors a function's output as the function's `valueOf`, occasionally useful in debugging/devtools
 */
function valueFunction ( fn ) { return fn.valueOf = fn; }
exports.valueFunction = valueFunction;

/**
 * Mirrors a function's output as the function's `toString`, occasionally useful in debugging/devtools
 */
function stringFunction ( fn ) { return fn.toString = fn; }
exports.stringFunction = stringFunction;


exports.env.server && ( module.exports = exports );
exports.env.client && ( global['Z'] = extend( global['Z'] || {}, exports ) );

})();