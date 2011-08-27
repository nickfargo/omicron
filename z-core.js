( function ( exports, undefined ) {

var	global = this,
	autochthon = global.Z,
	noConflict = function () {
		global.Z = autochthon;
		return this;
	},
	version = exports.version =
		'0.1.0',
	
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
( exports.type = type ).map = {};
each( 'Array Boolean Date Function Number Object RegExp String'.split(' '), function( i, name ) {
	type.map[ "[object " + name + "]" ] = name.toLowerCase();
});

/** isNumber */
function isNumber ( n ) { return !isNaN( parseFloat( n ) && isFinite( n ) ); }
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
 * ES5-style `Object.forEach`, with callback signature of `value, key, object`.
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
 * Near-straight port of jQuery `$.extend` method.
 */
function extend () {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !isFunction( target ) ) {
		target = {};
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( ( options = arguments[i] ) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( isPlainObject( copy ) || ( copyIsArray = isArray( copy ) ) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && isArray( src ) ? src : [];
					} else {
						clone = src && isPlainObject( src ) ? src : {};
					}
					
					// Never move original objects, clone them
					target[ name ] = extend( deep, clone, copy );
					
				// 
				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
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
	for ( key in obj ) if ( hasOwn.call( obj, key ) ) {
		result.push( key );
	}
	return result;
}
exports.keys = keys;

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



})( typeof module !== 'undefined' ? module.exports : this['Z'] );