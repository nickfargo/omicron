( function ( assert, undefined ) {

module( "edit" );

var _ = undefined, NIL = O.NIL;

test( "structural invariance", function () {
    var original = {
            a: 1,
            b: 2,
            c: {
                d: 3,
                e: 4
            },
            g: [ 1, 1, 2, 3, 5, 8 ]
        },
        edit = {
            a: NIL,
            b: '2',
            c: {
                d: NIL,
                e: 4,
                f: ['foo']
            },
            g: [ 0, _, _, 4, 8, 16 ],
            h: 'bar'
        },
        object = O.clone( original ),
        delta = O.delta( object, edit );

    assert.deepEqual( delta, {
        a: 1,
        b: 2,
        c: {
            d: 3,
            f: NIL
        },
        g: [ 1, _, _, 3, 5, 8 ],
        h: NIL
    });
    assert.deepEqual( object, {
        b: '2',
        c: {
            e: 4,
            f: ['foo']
        },
        g: [ 0, 1, 2, 4, 8, 16 ],
        h: 'bar'
    });
    assert.deepEqual( O.extend( true, object, delta ), original, "object restored from delta to original state" );
});

test( "referential invariance", function () {
    function Class ( properties ) {
        properties && O.extend( true, this, properties );
    }
    
    function fn () { return 3; }

    var deep = new Class({
            d: 4,
            e: 5
        }),
        shallow = new Class({
            a: 1,
            b: 2,
            ref: deep
        }),
        original = {
            ref: shallow,
            c: fn
        },
        edit = {
            ref: {
                ref: NIL
            }
        },
        object = O.clone( original ),
        delta = O.delta( object, edit );
    
    assert.strictEqual( delta.ref.ref, deep, "Reference held by `delta` after deletion from `object`" );
    assert.deepEqual( O.extend( true, object, delta ), original, "Restored `object` resembles original state" );
    assert.strictEqual( object.ref.ref, deep, "Reference held by `object` restored" );
});

test( "delta composition", function () {
    var original = {
            a: 1,
            b: '2',
            c: {
                d: 3,
                e: 4
            },
            g: [ 0, 1 ]
        },
        edits = [
            { a: "uno" },
            { a: "un", b: "deux" },
            { c: { d: "III", e: "IV" } },
            { a: NIL, f: "Foo" },
            { b: "dos", g: [ _, "une" ] }
        ],
        object = O.clone( original ),
        deltas = O.delta.apply( O, [ object ].concat( edits ) );

    assert.deepEqual(
        object,
        {
            b: "dos",
            c: {
                d: "III",
                e: "IV"
            },
            f: "Foo",
            g: [ 0, "une" ]
        },
        "Sequential edits"
    );
    assert.deepEqual(
        deltas,
        [
            { a: 1 },
            { a: "uno", b: "2" },
            { c: { d: 3, e: 4 } },
            { a: "un", f: NIL },
            { b: "deux", g: [ _, 1 ] }
        ],
        "Delta sequence"
    );
    assert.deepEqual(
        O.extend.apply( O, [ true, object ].concat( deltas.reverse() ) ),
        original,
        "Applying reverse delta composition to object yields content-equivalence to the original"
    );
});

test( "immutable flag", function () {
    var original = {
            a: 1,
            b: [ 2, 4, 9 ],
            c: 3,
            d: { e: 5 }
        },
        edit = {
            a: 'one',
            b: [ _, 4, 7, 8 ],
            c: NIL,
            d: { e: NIL, f: 6 }
        },
        object = O.clone( original ),
        delta = O.diff( object, edit );

    assert.deepEqual( object, original, "Immutable flag leaves object unchanged" );
    assert.deepEqual( delta, { a: 1, b: [ _, _, 9, NIL ], c: 3, d: { e: 5, f: NIL } }, "" );
});

test( "Use case: differentiated history", function () {
    var history = [
            {},
            { a: 1, b: 2 },
            { b: NIL, d: 4 },
            { a: NIL, e: 5 },
            { e: 2.718, f: 6 }
        ],
        index = 0;

    function data () {
        return O.clone( history[ index ] );
    }

    function back () {
        if ( index === 0 ) return;
        var o = history[ index ];
        history[ index ] = O.delta( o, history[ --index ] );
        return O.clone( history[ index ] = o );
    }

    function forward () {
        if ( index === history.length - 1 ) return;
        var o = history[ index ];
        history[ index ] = O.delta( o, history[ ++index ] );
        return O.clone( history[ index ] = o );
    }

    function push ( obj ) {
        var l, n, o = history[ index ];
        history[ index ] = O.delta( o, obj );
        history[ ++index ] = o;
        l = index + 1;
        ( n = history.length - l ) && history.splice( l, n );
        return l;
    }

    function replace ( obj ) {
        var o = history[ index ],
            d = O.diff( o, obj ),
            i;
        history[ index ] = obj;
        index > 0 &&
            ( history[ i = index - 1 ] = O.diff( O.clone( obj, d, history[i] ), obj ) );
        index < history.length - 1 &&
            ( history[ i = index + 1 ] = O.diff( O.clone( obj, d, history[i] ), obj ) );
        return d;
    }

    assert.deepEqual( data(), {} );
    assert.deepEqual( forward(), { a: 1, b: 2 } );
    assert.deepEqual( forward(), { a: 1, d: 4 } );
    assert.deepEqual( forward(), { d: 4, e: 5 } );
    assert.deepEqual( forward(), { d: 4, e: 2.718, f: 6 } );
    assert.deepEqual( forward(), undefined );

    assert.deepEqual( history, [
        { a: NIL, b: NIL },
        { b: 2, d: NIL },
        { a: 1, e: NIL },
        { e: 5, f: NIL },
        { d: 4, e: 2.718, f: 6 }
    ]);

    assert.deepEqual( back(), { d: 4, e: 5 } );
    assert.deepEqual( back(), { a: 1, d: 4 } );
    assert.deepEqual( back(), { a: 1, b: 2 } );
    assert.deepEqual( back(), {} );
    assert.deepEqual( back(), undefined );

    assert.deepEqual( history, [
        {},
        { a: 1, b: 2 },
        { b: NIL, d: 4 },
        { a: NIL, e: 5 },
        { e: 2.718, f: 6 }
    ]);

    forward();
    forward();
    assert.deepEqual( push({ b: 2, c: 3 }), 4 );
    assert.deepEqual( forward(), undefined );
    assert.deepEqual( data(), { a: 1, b: 2, c: 3, d: 4 } );

    assert.deepEqual( history, [
        { a: NIL, b: NIL },
        { b: 2, d: NIL },
        { b: NIL, c: NIL },
        { a: 1, b: 2, c: 3, d: 4 },
    ]);

    back();

    assert.deepEqual( history, [
        { a: NIL, b: NIL },
        { b: 2, d: NIL },
        { a: 1, d: 4 },
        { b: 2, c: 3 }
    ]);

    assert.deepEqual( replace({ a: 4, b: 3, d: 1 }), { a: 1, b: NIL, d: 4 } );

    assert.deepEqual( history, [
        { a: NIL, b: NIL },
        { a: 1, b: 2, d: NIL },
        { a: 4, b: 3, d: 1 },
        { a: 1, b: 2, c: 3, d: 4 }
    ]);
});

})( QUnit );