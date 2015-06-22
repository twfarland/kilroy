(function (K, U) {



// Utils

QUnit.test( "isTag", function (assert) { 
    assert.ok(U.isTag(['div', 123]));
    assert.notOk(U.isTag(123));
});

QUnit.test( "isNested", function (assert) {
    assert.ok(U.isNested([[]]));
    assert.notOk(U.isNested(['div']));
});

QUnit.test( "hasSameTagAndId", function (assert) {
    assert.ok(U.hasSameTagAndId(['div', 1], ['div', 2]));
    assert.notOk(U.hasSameTagAndId(['a', 1], ['div', 2]));
    assert.ok(U.hasSameTagAndId(['div', { id: 123 }, ''], ['div', { id: 123 }, '']));
    assert.notOk(U.hasSameTagAndId(['div', { id: 123 }, ''], ['div', { id: 456 }, '']));
});



// vDom

QUnit.test( "prepAttributeShorthand", function (assert) {
    assert.deepEqual(U.prepAttributeShorthand(['div', 123]), ['div', 123]);
    assert.deepEqual(U.prepAttributeShorthand(['#someid .someclass', 123]), ['div', { id: 'someid', 'class': 'someclass' }, 123]);
    assert.deepEqual(U.prepAttributeShorthand(['hr #someid .someclass .otherclass', { name: 'blah' }]), ['hr', { name: 'blah', id: 'someid', 'class': 'someclass otherclass' }]);
    assert.deepEqual(U.prepAttributeShorthand(['div', 123]), ['div', 123]);
});

QUnit.test( "prepChildren", function (assert) {
    assert.deepEqual(U.prepChildren(['div', 'a', 'b', 'c']), ['div', 'a', 'b', 'c']);
    assert.deepEqual(U.prepChildren(['div', { id: 123 }, 'a', 'b', 'c']), ['div', { id: 123 }, 'a', 'b', 'c']);
    assert.deepEqual(U.prepChildren(['a', { name: 'name' }]), ['a', { name: 'name' }]);
    assert.deepEqual(U.prepChildren(['div', [['a', 'b'], ['a', 'c']]]), ['div', ['a', 'b'], ['a', 'c']]);
    assert.deepEqual(U.prepChildren(['div', 'text', [[[['a', 'text2']]]]]), ['div', 'text', ['a', 'text2']]);
    assert.deepEqual(
        U.prepChildren(['div', [[[['p', [['a', 'b']]], 'text', ['a', 'c'], 'text2']]]]), 
        ['div', ['p', ['a', 'b']], 'text', ['a', 'c'], 'text2']
    );
});

QUnit.test( "prepVDomTag", function (assert) {
    assert.deepEqual(
        U.prepVDomTag(['a #someid .cls1 .cls2', [['b', 1], ['b', 2]]]),
        ['a', { id: 'someid', 'class': 'cls1 cls2' }, ['b', 1], ['b', 2]]
    );
});

QUnit.test( "vDomToHtmlString", function (assert) {
    assert.equal(U.vDomToHtmlString(['hr']), '<hr>');
    assert.equal(U.vDomToHtmlString(['div', 'text']), '<div>text</div>');
    assert.equal(U.vDomToHtmlString(['div', 'a ', 'b ', 'c']), '<div>a b c</div>');
    assert.equal(U.vDomToHtmlString(['div', 0, 0, undefined, 0]), '<div>000</div>');
    assert.equal(U.vDomToHtmlString(['div', { id: 'someid', 'class': 'someclass' }, 123]), '<div id="someid" class="someclass">123</div>');
});

QUnit.test( "htmlStringToDom", function (assert) {
    assert.equal(U.htmlStringToDom('<div>000</div>').outerHTML, '<div>000</div>');
    assert.equal(U.htmlStringToDom('<div>a b c</div>').outerHTML, '<div>a b c</div>');
    assert.equal(U.htmlStringToDom('<div id="someid" class="someclass">123</div>').outerHTML, '<div id="someid" class="someclass">123</div>');
    assert.equal(U.htmlStringToDom('<hr>').outerHTML, '<hr>');
});

QUnit.test('vDomToDom / updateDom', function (assert) { 

    function vDomTest (assert, a, b, f) {
        var v = U.vDomToDom(a);
        U.updateDom(v, a, b);
        (f) ? assert.ok(f(v, a, b)) : assert.equal(v.outerHTML, U.vDomToHtmlString(b));
    }

    vDomTest(assert, 
        ['div', { 'data-x': 'x' }, 'x'], 
        ['div', { 'data-y': 'y' }, 'y']
    );
    vDomTest(assert, 
        ['div', 'x'], 
        ['div', 'y']
    );
    vDomTest(assert, 
        ['div', { 'data-x': 'x', 'data-y': 'y' }, 'x'], 
        ['div', { 'data-y': 'y', 'data-z': 'z' }, 'yz']
    );
    vDomTest(assert, 
        ['div'], 
        ['div', 123]
    );
    vDomTest(assert, 
        ['div', 456], 
        ['div']
    );
    vDomTest(assert, 
        ['div', 789], 
        ['div', 987]
    );
    vDomTest(assert, 
        ['div', ['div', ['div', 'a']], ['div', 'b'], 'c'], 
        ['div', 'a', ['div', 'b'], ['div', ['div', 'c']]]
    );
    vDomTest(assert, 
        ['div', 
            ['div', { _key: 1 }, 1],
            ['div', { _key: 2 }, 2]], 
        ['div', 
            ['div', { _key: 2 }, 2],
            ['div', { _key: 3 }, 3]]
    );
    vDomTest(assert, 
        ['input', { type: 'checkbox', checked: true }], 
        ['input', { type: 'checkbox', checked: false, _focus: true }],
        function (v, a, b) { return !v.checked; }
    );
    vDomTest(assert, 
        ['select', 
            ['option', { value: 1, selected: true }, 1],
            ['option', { value: 2}, 2]], 
        ['select', 
            ['option', { value: 1 }, 1],
            ['option', { value: 2, selected: true }, 2]],
        function (v, a, b) { 
            return !v.childNodes[0].selected && v.childNodes[1].selected; 
        }
    );
});

function trigger (el, eventType) {

    var event = document.createEvent("HTMLEvents");
    event.initEvent(eventType, true, true);
    el.dispatchEvent(event);
}

QUnit.test('Kilroy, view only', function (assert) { 

    var ViewOnly = K({
        view: function () {
            return ['div', 123];
        }
    });

    var viewOnly = ViewOnly(123);

    document.body.appendChild(viewOnly.node);

    assert.ok(viewOnly);

});

QUnit.test('Kilroy, dom events', function (assert) { 

    assert.expect(2);

    var done = assert.async();

    var Basic = K({

        init: function (data) {
            this.data = data;
        },

        view: function () {
            var self = this;
            return ['div', self.data];
        },

        events: {
            click: {
                div: function (a) {
                    this.data = 456;
                    this.d(function () {
                        assert.ok(basic.data === 456);
                        done();
                    });
                }
            }
        }
    });

    var basic = Basic(123);

    document.body.appendChild(basic.node);

    assert.ok(basic.data === 123);

    trigger(basic.node, "click");

});

QUnit.test("Kilroy, rendering callback", function (assert) {

    assert.expect(1);

    var done  = assert.async();

    var Blank = K({
        x: true,
        view: function () { return ['div', 123]; }
    });

    var blank = Blank(); 

    document.body.appendChild(blank.node);

    blank.d(function () {
        assert.ok(this.x);
        done();
    });
});

QUnit.test('Kilroy, recursive view', function (assert) { 

    assert.expect(2);

    var Recursive = K({

        init: function (tree) {
            this.tree  = tree;
            this.maxDepth = 1;
        },

        view: function () {
            return this.treeView(this.tree, 1);
        },

        treeView: function (tree, depth) {
            var k = this;
            return ['ul .tree', { id: 'tree_' + tree.id }, 
                ['li', 
                    ['b', tree.id],
                    depth < k.maxDepth && tree.children && tree.children.map(function (child) {
                        return k.treeView(child, depth + 1);
                    })]];
        }
    });

    var rec = Recursive({ id: 1, children: [
        { id: 2 },
        { id: 3 },
        { id: 4, children: [
            { id: 5 },
            { id: 6, children: [
                { id: 7 }] }]},
        { id: 8 }]});

    document.body.appendChild(rec.node);

    assert.ok(document.getElementById('tree_7') === null);

    var done = assert.async();

    rec.maxDepth = 5;

    rec.d(function () {
        assert.ok(document.getElementById('tree_7') !== null);
        done();
    });

});




}).call(this, Kilroy, KilroyUnits);