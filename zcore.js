( function ( undefined ) {

var global = this,

    exports = {
        VERSION: '0.1.3',
        env: {
            server: typeof module !== 'undefined' && typeof require !== 'undefined' &&
                !!module.exports,
            client: typeof window !== 'undefined' && window === global
        }
    },
    
    // #### regexp
    // 
    // Store of commonly used regular expression instances.
    regexp = exports.regexp = {
        whitespace: /\s+/
    },

    // #### DELETE
    // 
    // Unique directive object. Most commonly used in the object arguments of `extend`, where a
    // property whose value is set to `DELETE` indicates that the corresponding property on the
    // subject is to be deleted.
    DELETE = exports.DELETE = ( function () { function DELETE () {} return new DELETE; } )(),

    // #### toString
    // 
    toString = exports.toString =
        Object.prototype.toString,
    
    // #### hasOwn
    // 
    hasOwn = exports.hasOwn =
        Object.prototype.hasOwnProperty,
    
    // #### trim
    //
    // jQuery-style end-whitespace trimmer; uses the native `String.prototype.trim` if available.
    trim = exports.trim =
        String.prototype.trim ?
            function ( text ) {
                return text == null ? '' : String.prototype.trim.call( text );
            } :
            function ( text ) {
                return text == null ? '' :
                    text.toString().replace( /^\s+/, '' ).replace( /\s+$/, '' );
            },
    
    // #### slice
    //
    slice = exports.slice =
        Array.prototype.slice;


// #### noConflict
//
exports.noConflict = ( function () {
    var autochthon = global.Z;
    return function () {
        global.Z = autochthon;
        return this;
    };
})();

// #### noop
// 
// General-purpose empty function. May also be deemed suitable as a unique alternative “nil” type
// for strict-equal matches whenever it’s desirable to avoid traditional `null` and `undefined`.
function noop () {}
exports.noop = noop;

// #### getThis
// 
// Like `noop`, except suited for substitution on methods designed to be chainable.
function getThis () { return this; }
exports.getThis = getThis;

// Calls the specified native function if it exists and returns its result; if no such function
// exists on `obj` as registered in `__native.fn`, returns our unique `noop` (as opposed to `null`
// or `undefined`, which may be a valid result from the native function itself).
function __native ( item, obj /* , ... */ ) {
    var n = __native.fn[ item ];
    return n && obj[ item ] === n ? n.apply( obj, slice.call( arguments, 2 ) ) : noop;
}
__native.fn = {
    forEach: Array.prototype.forEach
};

// #### type
// 
// A safe alternative to `typeof` that checks against `Object.prototype.toString()`.
function type ( obj ) {
    return obj == null ? String( obj ) : type.map[ toString.call( obj ) ] || 'object';
}
type.map = {};
each( 'Array Boolean Date Function Number Object RegExp String'.split(' '), function( i, name ) {
    type.map[ "[object " + name + "]" ] = name.toLowerCase();
});
exports.type = type;

// #### isBoolean
function isBoolean ( obj ) { return type( obj ) === 'boolean'; }
exports.isBoolean = isBoolean;

// #### isString
function isString ( obj ) { return type( obj ) === 'string'; }
exports.isString = isString;

// #### isNumber
function isNumber ( n ) { return !isNaN( parseFloat( n ) ) && isFinite( n ); }
exports.isNumber = isNumber;

// #### isArray
function isArray ( obj ) { return type( obj ) === 'array'; }
exports.isArray = isArray;

// #### isFunction
function isFunction ( obj ) { return type( obj ) === 'function'; }
exports.isFunction = isFunction;

// #### isPlainObject
// 
// Near-straight port of jQuery `isPlainObject`
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

// #### isEmpty
// 
// Returns a boolean indicating whether the object or array at `obj` contains any members. For an
// `Object` type, if `andPrototype` is included and truthy, `obj` must be empty throughout its
// prototype chain as well.
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

// #### each
// 
// Functional iterator with jQuery-style callback signature of `key, value, object`.
function each ( obj, fn ) {
    if ( !obj ) { return; }
    var key, i, l = obj.length;
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

// #### forEach
// 
// Functional iterator with ES5-style callback signature of `value, key, object`.
function forEach ( obj, fn, context ) {
    var n, l, key, i;
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

// #### extend
// 
// Based on the jQuery `extend` method. Returns the first object-typed argument as `subject`
// (unless directed otherwise), to which any subsequent object arguments are copied in order.
// Optionally the first argument may be a Boolean `deep`, or a whitespace-delimited `flags`
// String containing any of the following keywords:
// 
// * `deep` : If a property is an object or array, a structured clone is created on the subject.
// * `own` : Restricts extended properties to those filtered by `Object.hasOwnProperty`.
// * `all` : Includes properties with undefined values.
// * `delta` : Returns the **delta**, a structured clone object that reflects the changes made to
//      the properties of `subject`. If multiple objects are extended onto `subject`, an array of
//      deltas is returned. (Applying the deltas in reverse order in an `extend('deep')` on
//      `subject` would revert the contents of `subject` to their original state.)
function extend () {
    var args = slice.call( arguments ),
        t = type( args[0] ),
        flags =
            t === 'boolean' ? { deep: args.shift() } :
            t === 'string' ? assign( args.shift() ) :
            {},
        subject = args.shift() || {},
        i = 0, l = args.length,
        deltas = flags.delta && l > 1 && [],
        subjectIsArray, delta, key, value, valueIsArray, source, target, clone, result;
    
    typeof subject === 'object' || isFunction( subject ) || ( subject = {} );
    subjectIsArray = isArray( subject );
    for ( ; i < l; i++ ) {
        flags.delta && ( delta = subjectIsArray ? [] : {} );
        deltas && deltas.push( delta );
        source = args[i];
        if ( source == null ) continue;
        for ( key in source ) if ( !flags.own || hasOwn.call( source, key ) ) {
            value = source[ key ];
            if ( value === subject ) continue;
            if ( value === DELETE ) {
                delta && ( delta[ key ] = subject[ key ] );
                delete subject[ key ];
            }
            else if ( flags.deep && value &&
                ( isPlainObject( value ) || ( valueIsArray = isArray( value ) ) )
            ) {
                target = subject[ key ];
                if ( valueIsArray ) {
                    valueIsArray = false;
                    clone = target && isArray( target ) ? target : [];
                } else {
                    clone = target && ( isFunction( target ) || typeof target === 'object' ) ?
                        target : {};
                }
                result = extend( keys( flags ).join(' '), clone, value );
                delta && ( delta[ key ] = hasOwn.call( subject, key ) ? result : DELETE );
                subject[ key ] = clone;
            }
            else if ( subject[ key ] !== value && ( value !== undefined || flags.all ) ) {
                delta && ( delta[ key ] = hasOwn.call( subject, key ) ? subject[ key ] : DELETE );
                subject[ key ] = value;
            }
        }
    }
    return deltas || delta || subject;
}
exports.extend = extend;

// #### assign
// 
// Facilitates assignment operations of a value to one or more keys of an object.
function assign ( target, map, value ) {
    var key, list, i, l;

    if ( typeof target === 'string' ) {
        value = arguments.length === 1 ? true : map, map = target, target = {};
    } else if ( map === undefined ) {
        map = target, target = {};
    }
    if ( typeof map === 'string' ) {
        key = map, map = {}, map[ key ] = value;
    }

    for ( key in map ) if ( hasOwn.call( map, key ) ) {
        value = map[ key ];
        list = key.split( regexp.whitespace );
        for ( i = 0, l = list.length; i < l; i++ ) {
            target[ list[i] ] = value;
        }
    }

    return target;
}
exports.assign = assign;

// #### flatten
// 
// Extracts elements of nested arrays into a single flat array.
function flatten ( array ) {
    isArray( array ) || ( array = [ array ] );
    var i = 0,
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

// #### keys
// 
// Returns an array containing the keys of a hashmap.
function keys ( obj ) {
    var key, result = [];
    if ( !( isPlainObject( obj ) || isFunction( obj ) ) ) { throw new TypeError; }
    for ( key in obj ) { hasOwn.call( obj, key ) && result.push( key ); }
    return result;
}
exports.keys = keys = isFunction( Object.keys ) ? Object.keys : keys;

// #### invert
// 
// Returns a hashmap that is the key-value inversion of the supplied string array.
function invert ( array ) {
    for ( var i = 0, l = array.length, map = {}; i < l; ) {
        map[ array[i] ] = i++;
    }
    return map;
}
exports.invert = invert;

// #### alias
// 
// Copies the values of members of an object to one or more different keys on that same object.
function alias ( object, map ) {
    var key, value, names, i, l;
    for ( key in map ) if ( key in object ) {
        names = map[ key ].split( regexp.whitespace );
        for ( i = 0, l = names.length; i < l; i++ ) {
            object[ names[i] ] = object[ key ];
        }
    }
    return object;
}
exports.alias = alias;

// #### thunk
// 
// Creates and returns a lazy evaluator, a function that returns the enclosed argument.
function thunk ( obj ) {
    return function () { return obj; };
}
exports.thunk = thunk;

// #### lookup
// 
// Retrieves the value at the location indicated by the provided `path` string inside a
// nested object `obj`. For example:
// 
//      var x = { a: { b: 42 } };
//      lookup( x, 'a' );        // { "b": 42 }
//      lookup( x, 'a.b' );      // 42
//      lookup( x, 'a.b.c' );    // undefined
//
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

// #### create
// 
// Reference to or partial shim for `Object.create`.
function create ( prototype ) {
    var object, constructor = function () {};
    constructor.prototype = prototype;
    object = new constructor;
    object.__proto__ = prototype;
    object.constructor = prototype.constructor;
    return object;
}
exports.create = isFunction( Object.create ) ? ( create = Object.create ) : create;

// #### inherit
// 
// Prototypal inheritance facilitator.
// 
// * `child` and `parent` are constructor functions, such that
//       `new child instanceof parent === true`
// * `child` also inherits static members that are direct properties of `parent`
// * `properties` is an object containing properties to be added to the prototype of `child`
// * `statics` is an object containing properties to be added to `child` itself.
function inherit (
    /*Function*/ child,
    /*Function*/ parent,      // optional
      /*Object*/ properties,  // optional
      /*Object*/ statics      // optional
) {
    isFunction( parent ) ?
        ( ( extend( child, parent ).prototype = create( parent.prototype ) ).constructor = child ) :
        ( statics = properties, properties = parent );
    properties && extend( child.prototype, properties );
    statics && extend( child, statics );
    return child;
}
exports.inherit = inherit;

// #### getPrototypeOf
// 
// Returns an object’s prototype. In environments without native support, this may only work if
// the object’s constructor and its prototype are properly associated, e.g., as facilitated by
// the `create` function.
function getPrototypeOf ( obj ) {
    return obj.__proto__ || obj.constructor.prototype;
}
exports.getPrototypeOf = isFunction( Object.getPrototypeOf ) ?
    ( getPrototypeOf = Object.getPrototypeOf ) : getPrototypeOf;

// #### valueFunction
// 
// Cyclically references a function’s output as its own `valueOf` property.
function valueFunction ( fn ) { return fn.valueOf = fn; }
exports.valueFunction = valueFunction;

// #### stringFunction
// 
// Cyclically references a function’s output as its own `toString` property.
function stringFunction ( fn ) { return fn.toString = fn; }
exports.stringFunction = stringFunction;

// #### privilege
// 
// Generates partially applied functions for use as methods on an `object`.
// 
// Functions sourced from `methodStore` accept as arguments the set of variables to be closed over,
// and return the enclosed function that will become the `object`’s method.
// 
// The `map` argument maps a space-delimited set of method names to an array of free variables.
// These variables are passed as arguments to each of the named methods as found within
// `methodStore`.
// 
// This approach promotes reuse of a method’s logic by decoupling the function from the native
// scope of its free variables. A subsequent call to `privilege`, then, can be used on behalf of a
// distinct (though likely related) `object` to generate methods that are identical but closed
// over a distinct set of variables.
function privilege ( object, methodStore, map ) {
    each( map, function ( names, args ) {
        each( names.split( regexp.whitespace ), function ( i, methodName ) {
            object[ methodName ] = methodStore[ methodName ].apply( undefined, args );
        });
    });
    return object;
}
exports.privilege = privilege;


// 
exports.env.server && ( module.exports = exports );
exports.env.client && ( global['Z'] = exports );

})();