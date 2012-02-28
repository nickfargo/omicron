( function ( assert, undefined ) {

module( "extend" );

test( "structural invariance", function () {
    var _ = undefined, NIL = Z.NIL,

        original = {
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
        object = Z.extend( true, {}, original ),
        delta = Z.delta( object, edit );

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
    assert.deepEqual( Z.extend( true, object, delta ), original, "object restored from delta to original state" );
});

test( "referential invariance", function () {
    function Class ( properties ) {
        properties && Z.extend( true, this, properties );
    }
    
    var _ = undefined, NIL = Z.NIL,
        fn = function () { return 3; },

        deep = new Class({
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
        object = Z.extend( true, {}, original ),
        delta = Z.delta( object, edit );
    
    assert.strictEqual( delta.ref.ref, deep, "Reference held by `delta` after deletion from `object`" );
    assert.deepEqual( Z.extend( 'deep', object, delta ), original, "Restored `object` resembles original state" );
    assert.strictEqual( object.ref.ref, deep, "Reference held by `object` restored" );
});

test( "delta composition", function () {
    var _ = undefined, NIL = Z.NIL,

        original = {
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
        object = Z.extend( true, {}, original ),
        deltas = Z.delta.apply( Z, [ object ].concat( edits ) );

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
        Z.extend.apply( Z, [ true, object ].concat( deltas.reverse() ) ),
        original,
        "Delta composition applied in reverse yields content-equivalence to the original object"
    );
});

test( "immutable flag", function () {
    var _ = undefined, NIL = Z.NIL,

        original = {
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
        object = Z.extend( original ),
        delta = Z.diff( object, edit );

    assert.deepEqual( object, original, "Immutable flag leaves object unchanged" );
    assert.deepEqual( delta, { a: 1, b: [ _, _, 9, NIL ], c: 3, d: { e: 5, f: NIL } }, "" );
});

})( QUnit );