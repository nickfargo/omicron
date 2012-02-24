( function ( assert, undefined ) {

module( "extend" );

test( "structural invariance", function () {
	var	_ = undefined, DEL = Z.DELETE,

		original = { a:1, b:2, c:{ d:3, e:4 }, f:[ 1, 1, 2, 3, 5, 8 ] },
		object = Z.extend( true, {}, original ),
		edit = { a:DEL, b:'2', c:{ d:DEL }, f:[ 0, _, _, 4, 8, 16 ] },
		delta = Z.extend( 'deep delta', object, edit );
	
	assert.deepEqual( delta, { a:1, b:2, c:{ d:3 }, f:[ 1, _, _, 3, 5, 8 ] }, "delta" );
	assert.deepEqual( object, { b:'2', c:{ e:4 }, f:[ 0, 1, 2, 4, 8, 16 ] }, "object" );
	assert.deepEqual( Z.extend( 'deep', object, delta ), original, "object restored from delta to original state" );
});

test( "referential invariance", function () {
	function Class ( properties ) {
		properties && Z.extend( true, this, properties );
	}
	
	var	_ = undefined, DEL = Z.DELETE,

		deep = new Class({ d:4, e:5 }),
		shallow = new Class({ a:1, b:2, ref:deep }),
		original = { ref:shallow, c:3 },
		object = Z.extend( true, {}, original ),
		edit = { ref:{ ref:DEL } },
		delta = Z.extend( 'deep delta', object, edit );
	
	assert.strictEqual( delta.ref.ref, deep, "Reference held by `delta` after deletion from `object`" );
	assert.deepEqual( Z.extend( 'deep', object, delta ), original, "Restored `object` resembles original state" );
	assert.strictEqual( object.ref.ref, deep, "Reference held by `object` restored" );
test( "delta composition", function () {
    var _ = undefined, DELETE = Z.DELETE,

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
            { a: DELETE, f: "Foo" },
            { b: "dos", g: [ _, "une" ] }
        ],
        object = Z.extend( true, {}, original ),
        deltas = Z.extend.apply( Z, [ 'deep delta', object ].concat( edits ) );

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
            { a: "un", f: DELETE },
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

})( QUnit );