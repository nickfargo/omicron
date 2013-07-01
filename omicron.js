// Copyright (C) 2011-2013
// Nick Fargo, Z Vector Inc.
//
// [`LICENSE`](https://github.com/nickfargo/omicron/blob/master/LICENSE) MIT.
//
// Omicron (**“O”**) is a small JavaScript library of functions and tools that
// assist with:
//
// * Object manipulation and differential operations
// * Prototypal inheritance
// * Selected general tasks: safe typing, functional iteration, etc.
//
// [omicronjs.org](http://omicronjs.org/)
//
// <a class="icon-large icon-octocat"
//    href="http://github.com/nickfargo/omicron/"></a>

;( function ( undefined ) {

var global = this;

var O = {
  VERSION: '0.2.0',
  env: {
    server: typeof module !== 'undefined' &&
            typeof require !== 'undefined' &&
            !!module.exports,
    client: typeof window !== 'undefined' && window === global,
    debug:  false
  }
};


// #### [NIL](#nil)
//
// Unique object reference. Used by [`edit`](#edit) and the related
// differential operation functions, where an object with a property whose
// value is set to `NIL` indicates the absence or deletion of the
// corresponding property on an associated operand.
var NIL = O.NIL = ( function () { function NIL () {} return new NIL; }() );


// #### [toString](#to-string)
//
var toString = O.toString =
  Object.prototype.toString;


// #### [hasOwn](#has-own)
//
var hasOwn = O.hasOwn =
  Object.prototype.hasOwnProperty;


// #### [trim](#trim)
//
var trim = O.trim =
  String.prototype.trim ?
    function ( text ) {
      return text == null ? '' : String.prototype.trim.call( text );
    } :
    function ( text ) {
      return text == null ?
        '' :
        text.toString()
          .replace( /^\s+/, '' )
          .replace( /\s+$/, '' );
    };


// #### [slice](#slice)
//
var slice = O.slice =
  Array.prototype.slice;


// #### [noConflict](#no-conflict)
//
O.noConflict = ( function () {
  var original = global.O;
  return function () {
    global.O = original;
    return this;
  };
}() );


// #### [noop](#noop)
//
// General-purpose empty function.

function noop () {}
O.noop = noop;


// #### [getThis](#get-this)
//
// Like [`noop`](#noop), except suited for substitution on methods that would
// normally return their context object.

function getThis () { return this; }
O.getThis = getThis;


// Calls the specified native function if it exists and returns its result; if
// no such function exists on `obj` as registered in `__native.fn`, the unique
// [`NIL`](#nil) is returned (as opposed to `null` or `undefined`, either of
// which may be a valid result from the native function itself).

function __native ( item, obj /* , ... */ ) {
  var n = __native.fn[ item ];
  return n && obj[ item ] === n ?
    n.apply( obj, slice.call( arguments, 2 ) ) :
    NIL;
}
__native.fn = {
  forEach: Array.prototype.forEach,
  indexOf: Array.prototype.indexOf
};


// #### [type](#type)
//
// A browser-safe universal alternative to `typeof` that checks against
// `Object.prototype.toString`.

var type = ( function () {
  var map = {};
  var types = 'Arguments Array Boolean Date Error Function Number Object \
               RegExp String';
  forEach( types.split(/\s+/), function ( name ) {
    map[ "[object " + name + "]" ] = name.toLowerCase();
  });
  function type ( obj ) {
    if ( obj == null ) return String( obj );
    return map[ toString.call( obj ) ] || 'object';
  }
  return type;
}() );
O.type = type;


// #### [isNumber](#is-number)

function isNumber ( n ) {
  return isFinite( n ) && !isNaN( parseFloat( n ) );
}
O.isNumber = isNumber;


// #### [isArray](#is-array)
//
// > Requires: `toString`

function isArray ( obj ) {
  return toString.call( obj ) === '[object Array]';
}
O.isArray = isArray;


// #### [isError](#is-error)
//
// > Requires: `toString`

function isError ( e ) {
  return typeof e === 'object' && toString.call( e ) === '[object Error]';
}
O.isError = isError;


// #### [isPlainObject](#is-plain-object)
//
// Near-straight port of jQuery `isPlainObject`.
//
// > Requires: `type`, `hasOwn`

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
O.isPlainObject = isPlainObject;


// #### [isEmpty](#is-empty)
//
// Returns a boolean indicating whether the object or array at `obj` contains
// any members. For an `Object` type, if `andPrototype` is included and truthy,
// `obj` must be empty throughout its prototype chain as well.
//
// > Requires: `isArray`, `hasOwn`

function isEmpty ( obj, andPrototype ) {
  var key;
  if ( isArray( obj ) && obj.length ) return false;
  for ( key in obj ) if ( andPrototype || hasOwn.call( obj, key ) ) {
    return false;
  }
  return true;
}
O.isEmpty = isEmpty;


// #### [isEqual](#is-equal)
//
// Performs a deep equality test.
//
// > Requires: `edit`, `isEmpty`

function isEqual ( subject, object ) {
  return subject === object ||
    isEmpty( edit(
      'deep all absolute immutable delta', subject, object || {}
    ));
}
O.isEqual = isEqual;


// #### [forEach](#for-each)
//
// Functional iterator with ES5-style callback signature of
// `value, key, object`.

function forEach ( obj, fn, context ) {
  var n, l, k, i;
  if ( obj == null ) return;
  if ( ( n = __native( 'forEach', obj, fn, context ) ) !== NIL ) return n;
  if ( ( l = obj.length ) === undefined || typeof obj === 'function' ) {
    for ( k in obj ) {
      if ( fn.call( context || obj[k], obj[k], k, obj ) === false ) {
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
O.forEach = O.each = forEach;


// #### [edit](#edit)
//
// Performs a differential operation across multiple objects.
//
// By default, `edit` returns the first object-typed argument as `subject`, to
// which each subsequent `source` argument is copied in order. Optionally the
// first argument may be either a Boolean `deep`, or a whitespace-delimited
// `flags` String containing any of the following keywords:
//
// * `deep` : If a `source` property is an object or array, a structured clone
//      is created on `subject`.
//
// * `own` : Excludes `source` properties filtered by `Object.hasOwnProperty`.
//
// * `all` : Includes `source` properties with values of `NIL` or `undefined`.
//
// * `delta` : Returns the **delta**, a structured object that reflects the
//      changes made to the properties of `subject`. If multiple object
//      arguments are provided, an array of deltas is returned. (Applying the
//      deltas in reverse order in an `edit('deep')` on `subject` would revert
//      the contents of `subject` to their original state.)
//
// * `immutable` : Leaves `subject` unchanged. Useful, for example, in
//      combination with flags `delta` and `absolute` for non-destructively
//      computing a differential between `source` and `subject`.
//
// * `absolute` : By default an edit operation is *relative*, in that the
//      properties of `subject` affected by the operation are limited to those
//      also present within each `source`. By including the `absolute` flag,
//      properties in `subject` that are *not* also present within each
//      `source` will be deleted from `subject`, and will also affect any
//      returned delta accordingly.
//
// Contains techniques and influences from the deep-cloning procedure of
// `jQuery.extend`, with which `edit` also retains a compatible interface.
//
// > See also: [`clone`](#clone), [`delta`](#delta), [`diff`](#diff),
// [`assign`](#assign)
function edit () {
  var i, l, t, flags, flagsString, subject, subjectIsArray, deltas, delta,
    key, value, valueIsArray, source, target, clone, result;

  i = 0; l = arguments.length;
  t = type( arguments[0] );

  if ( t === 'boolean' ) {
    flagsString = 'deep';
    flags = { deep: flagsString };
    i += 1;
  } else if ( t === 'string' ) {
    flagsString = arguments[i];
    flags = assign( flagsString );
    i += 1;
  } else {
    flags = NIL;
  }

  subject = arguments[i] || {};
  i += 1;
  if ( typeof subject !== 'object' && typeof subject !== 'function' ) {
    subject = {};
  }
  subjectIsArray = isArray( subject );

  flags.delta && l - 1 > i && ( deltas = [] );

  for ( ; i < l; i++ ) {
    flags.delta && ( delta = subjectIsArray ? [] : {} );
    deltas && deltas.push( delta );
    source = arguments[i];

    if ( source == null ) continue;

    for ( key in source ) if ( !flags.own || hasOwn.call( source, key ) ) {
      value = source[ key ];
      if ( value === subject ) continue;
      if ( value === NIL && !flags.all ) {
        delta && ( delta[ key ] = subject[ key ] );
        flags.immutable || delete subject[ key ];
      }
      else if ( flags.deep && value && ( isPlainObject( value ) ||
        ( valueIsArray = isArray( value ) ) )
      ) {
        target = subject[ key ];
        if ( valueIsArray ) {
          valueIsArray = false;
          clone = target && isArray( target ) ?
            target :
            [];
        } else {
          clone = target && ( typeof target === 'object' ||
            typeof target === 'function' ) ? target : {};
        }
        result = edit( flagsString, clone, value );
        if ( delta ) {
          if ( hasOwn.call( subject, key ) ) {
            if ( result && !isEmpty( result ) ) {
              delta[ key ] = result;
            }
          } else {
            delta[ key ] = NIL;
          }
        }
        flags.immutable || ( subject[ key ] = clone );
      }
      else if ( ( value !== undefined || flags.all ) &&
        ( !hasOwn.call( subject, key ) || subject[ key ] !== value )
      ) {
        if ( delta ) {
          delta[ key ] = hasOwn.call( subject, key ) ?
            subject[ key ] :
            NIL;
        }
        flags.immutable || ( subject[ key ] = value );
      }
    }
    if ( flags.absolute && ( flags.delta || !flags.immutable ) ) {
      for ( key in subject ) if ( hasOwn.call( subject, key ) ) {
        if ( !( flags.own ?
              hasOwn.call( source, key ) :
              key in source )
        ) {
          delta && ( delta[ key ] = subject[ key ] );
          flags.immutable || delete subject[ key ];
        }
      }
    }
  }
  return deltas || delta || subject;
}
O.edit = O.extend = edit;


// #### [clone](#clone)
//
// Specialization of [`edit`](#edit).
//
// > Requires: `edit`, `isArray`

function clone () {
  return edit.apply( O, [ 'deep all', isArray( arguments[0] ) ? [] : {} ]
    .concat( slice.call( arguments ) ) );
}
O.clone = clone;


// #### [delta](#delta)
//
// Specialization of [`edit`](#edit) that applies changes defined in `source`
// to `subject`, and returns the **anti-delta**: a structured map containing
// the properties of `subject` displaced by the operation. Previously
// nonexistent properties are recorded as [`NIL`](#nil) in the anti-delta.
// The prior condition of `subject` can be restored in a single transaction
// by immediately providing this anti-delta object as the `source` argument in
// a subsequent `edit` operation upon `subject`.
//
// > Requires: `edit`

function delta () {
  return edit.apply( O, [ 'deep delta' ]
    .concat( slice.call( arguments ) ) );
}
O.delta = delta;


// #### [diff](#diff)
//
// Specialization of [`edit`](#edit) that returns the delta between the
// provided `subject` and `source`. Operates similarly to [`delta`] except no
// changes are made to `subject`, and `source` is evaluated absolutely rather
// than applied relatively.
//
// > Requires: `edit`

function diff () {
  return edit.apply( O, [ 'deep delta immutable absolute' ]
    .concat( slice.call( arguments ) ) );
}
O.diff = diff;


// #### [assign](#assign)
//
// Facilitates one or more assignments of a value to one or more keys of an
// object.
//
// > Requires: `NIL`, `hasOwn`

function assign ( target, map, value, separator ) {
  var argLen, valuesMirrorKeys, key, list, i, l;

  argLen = arguments.length;
  if ( typeof target === 'string' ) {
    valuesMirrorKeys = argLen === 1;
    value = map; map = target; target = {};
  } else {
    if ( typeof map === 'string' ) {
      if ( argLen === 2 ) {
        valuesMirrorKeys = true;
      } else {
        // `value` is present, and `map` is a key or "deep key";
        // do `lookup`-style assignment
        list = map.split( separator || '.' );
        for ( i = 0, l = list.length; i < l; i++ ) {

          // To proceed `target` must be an `Object`.
          if ( target == null || typeof target !== 'object' &&
            typeof target !== 'function' ) return;

          key = list[i];

          // If at the end of the deep-key, assign/delete and return.
          // For deletions, return `NIL` to indicate a `true` result
          // from the `delete` operator.
          if ( i === l - 1 ) {
            if ( value === NIL ) {
              return delete target[ key ] ? NIL : undefined;
            } else {
              return target[ key ] = value;
            }
          }

          // Advance `target` to the next level. If nothing is there
          // already, then: for an assignment, create a new object in
          // place and continue; for a deletion, return `NIL`
          // immediately to reflect what would have been a `true`
          // result from the `delete` operator.
          if ( hasOwn.call( target, key ) ) {
            target = target[ key ];
          } else {
            if ( value === NIL ) return NIL;
            target = target[ key ] = {};
          }
        }
      }
    }
    else if ( map === undefined ) {
      map = target; target = {};
    }
  }
  if ( typeof map === 'string' ) {
    key = map; ( map = {} )[ key ] = value;
  }

  for ( key in map ) if ( hasOwn.call( map, key ) ) {
    list = key.split(/\s+/);
    if ( valuesMirrorKeys ) {
      for ( i = 0, l = list.length; i < l; i++ ) {
        value = list[i];
        target[ value ] = value;
      }
    } else {
      value = map[ key ];
      for ( i = 0, l = list.length; i < l; i++ ) {
        target[ list[i] ] = value;
      }
    }
  }

  return target;
}
O.assign = assign;


// #### [flatten](#flatten)
//
// Extracts elements of nested arrays into a single flat array.
//
// > Requires: `isArray`

function flatten ( array ) {
  if ( !isArray( array ) ) array = [ array ];
  var i = 0;
  var l = array.length;
  var item;
  var result = [];
  while ( i < l ) {
    item = array[ i++ ];
    if ( isArray( item ) ) {
      result = result.concat( flatten( item ) );
    } else {
      result.push( item );
    }
  }
  return result;
}
O.flatten = flatten;


// #### [indexOf](#index-of)
//
// Emulates (IE<9) or calls native `Array.prototype.indexOf`.

function indexOf ( array, target, startIndex ) {
  var n, i, l;
  if ( array == null ) return -1;
  if ( ( n = __native( 'indexOf', array, target ) ) !== NIL ) return n;
  for ( i = startIndex || 0, l = array.length; i < l; i++ ) {
    if ( i in array && array[i] === target ) return i;
  }
  return -1;
}
O.indexOf = indexOf;


// #### [unique](#unique)
//
// Returns a copy of `array` with any duplicate elements removed.

function unique ( array ) {
  var result, i, l, item;
  if ( !array ) return [];
  result = [];
  for ( i = 0, l = array.length; i < l; i++ ) {
    item = array[i];
    ~indexOf( result, item ) || result.push( item );
  }
  return result;
}
O.unique = O.uniq = unique;


// #### [keys](#keys)
//
// Returns an array containing the enumerable keys of an object.
//
// > Requires: `hasOwn`

function keys ( obj ) {
  if ( obj == null || typeof obj !== 'object' && typeof obj !== 'function' ) {
    throw new TypeError;
  }
  var key, result = [];
  for ( key in obj ) if ( hasOwn.call( obj, key ) ) result.push( key );
  return result;
}
O.keys = typeof Object.keys === 'function' ? ( keys = Object.keys ) : keys;


// #### [invert](#invert)
//
// Returns an object that is the key-value inversion of the supplied string
// array.
//
// > Requires: `hasOwn`, `isArray`

function invert ( obj ) {
  var i, l, map = {};
  if ( isArray( obj ) ) {
    for ( i = 0, l = obj.length; i < l; i++ ) map[ ''+obj[i] ] = i;
  } else {
    for ( i in obj ) if ( hasOwn.call( obj, i ) ) map[ ''+obj[i] ] = i;
  }
  return map;
}
O.invert = invert;


// #### [alias](#alias)
//
// Copies the values of members of an object to one or more different keys on
// that same object.

function alias ( object, map ) {
  var key, value, names, i, l;
  for ( key in map ) if ( key in object ) {
    names = map[ key ].split(/\s+/);
    for ( i = 0, l = names.length; i < l; i++ ) {
      object[ names[i] ] = object[ key ];
    }
  }
  return object;
}
O.alias = alias;


// #### [thunk](#thunk)
//
// Creates and returns a lazy evaluator, a function that returns the enclosed
// argument.

function thunk ( obj ) {
  return function () { return obj; };
}
O.thunk = thunk;


// #### [has](#has)
//
// Returns a boolean that verifies the existence of a key, indicated by the
// provided `path` string, within a nested object `obj`.
//
//      var x = { a: { b: 42 } };
//      has( x, 'a' );        // true
//      has( x, 'a.b' );      // true
//      has( x, 'a.b.c' );    // false
//
// > See also: [lookup](#lookup)
//
// > Requires: `hasOwn`

function has ( obj, path, separator, ownProperty ) {
  var i, l, name;

  if ( obj == null || typeof path !== 'string' ) return false;
  if ( typeof separator === 'boolean' && arguments.length < 4 ) {
    ownProperty = separator; separator = undefined;
  }

  separator || ( separator = '.' );
  if ( !~path.indexOf( separator ) ) {
    return ownProperty ? hasOwn.call( obj, path ) : path in obj;
  }

  path = path.split( separator );
  for ( i = 0, l = path.length; i < l && obj != null; i++ ) {
    if ( typeof obj !== 'object' && typeof obj !== 'function' ) {
      return false;
    }
    name = path[i];
    if ( ownProperty && !hasOwn.call( obj, name ) ) return false;
    if ( i === l - 1 ) return name in obj;
    obj = obj[ name ];
  }
  return false;
}
O.has = has;


// #### [lookup](#lookup)
//
// Retrieves the value at the location indicated by the provided `path` string
// inside a nested object `obj`. For example:
//
//      var x = { a: { b: 42 } };
//      lookup( x, 'a' );        // { "b": 42 }
//      lookup( x, 'a.b' );      // 42
//      lookup( x, 'a.b.c' );    // undefined
//
// > Requires: `hasOwn`

function lookup ( obj, path, separator, ownProperty ) {
  var i, l, name;

  if ( obj == null || typeof path !== 'string' ) return;
  if ( typeof separator === 'boolean' && arguments.length < 4 ) {
    ownProperty = separator; separator = undefined;
  }
  path = path.split( separator || '.' );
  for ( i = 0, l = path.length; i < l && obj != null; i++ ) {
    if ( typeof obj !== 'object' && typeof obj !== 'function' ) return;
    name = path[i];
    if ( ownProperty && !hasOwn.call( obj, name ) ) return;
    obj = obj[ name ];
  }
  return obj;
}
O.lookup = lookup;


// #### [create](#create)
//
// Reference to or partial shim for `Object.create`.

var create = ( function () {
  function constructor () {}
  return function ( prototype ) {
    constructor.prototype = prototype;
    var object = new constructor;
    object.__proto__ = prototype;
    object.constructor = prototype.constructor;
    return object;
  };
}() );
O.create = Object.create? ( create = Object.create ) : create;


// #### [inherit](#inherit)
//
// Facilitates prototypal inheritance between a `child` constructor and a
// `parent` constructor.
//
// * `child` and `parent` are constructor functions, such that
//       `new child instanceof parent === true`
// * `child` inherits static properties of `parent` as its own static members
// * `properties` is an optional object containing properties to be added to
//       the prototype of `child`
// * `statics` is an optional object containing properties to be added to
//       `child` itself.
//
// > Requires: `edit`, `create`

function inherit ( child, parent, properties, statics ) {
  if ( typeof parent === 'function' ) {
    ( edit( child, parent ).prototype = create( parent.prototype ) )
      .constructor = child;
  } else {
    statics = properties; properties = parent;
  }
  properties && edit( child.prototype, properties );
  statics && edit( child, statics );
  return child;
}
O.inherit = inherit;


// #### [getPrototypeOf](#get-prototype-of)
//
// Returns an object’s prototype. In environments without native support, this
// may only work if the object’s constructor and its prototype are properly
// associated, e.g., as facilitated by the `create` function.
function getPrototypeOf ( obj ) {
  return obj.__proto__ || obj.constructor.prototype;
}
O.getPrototypeOf = typeof Object.getPrototypeOf === 'function' ?
  Object.getPrototypeOf : getPrototypeOf;


// #### [randomHex](#random-hex)
//
// Returns a random hex string of arbitrary `length`, generated as a
// concatenation of 32-bit (eight-character) chunks.
function randomHex ( length ) {
  if ( length === 0 ) return '';
  if ( length == null ) length = 8;
  if ( !( ( 0 < length && length < Infinity ) ) ) throw RangeError;
  var random = Math.random;
  var i = 0;
  var n = 1 + ( ( length - 1 ) >> 3 )|0;
  var result = '';
  while ( i++ < n ) {
    result += ( random().toString(16) + '00000000' ).slice( 2, 10 );
  }
  return length | -8 ? result.slice( 0, length ) : result;
}
O.randomHex = randomHex;

//
O.env.server && ( module.exports = O );
O.env.client && ( global['O'] = O );

}() );
