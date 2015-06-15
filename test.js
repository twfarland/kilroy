toString = Object.prototype.toString;

function eq (a, b) {
    console.log(a, b);
}


// :: vDom -> vDom
// on a vDom tag, extracts id and class shorthand, extending the object if any
// returns modified object

function prepAttributeShorthand (v) {

    var tag = v[0].split(/\s+/);

    if (tag.length > 1 || tag[0].charAt(0) === '#' || tag[0].charAt(0) === '.') {

        var attrs, a, attr, el = 'div';

        if (toString.call(v[1]) === '[object Object]') { 
            attrs = v[1];

        } else {
            attrs = {};
            v.splice(1, 0, attrs); 
        }

        for (a = 0; a < tag.length; a++) {

            attr = tag[a];

            if (attr.charAt(0) === '#') { 
                attrs.id = attr.slice(1);

            } else if (attr.charAt(0) === '.') { 
                attrs['class'] = (!attrs['class']) ? attr.slice(1) : attrs['class'] + ' ' + attr.slice(1);

            } else {
                el = attr;
            }   
        }

        v[0] = el;
    }

    return v;
}


eq(
    prepAttributeShorthand(['#someid .someclass', 123]),
    ['div', { id: 'someid', 'class': 'someclass' }, 123]
);

eq(
    prepAttributeShorthand(['div', 123]),
    ['div', 123]
);

var vd1 = ['hr #someid .someclass .otherclass', { name: 'blah' }];
prepAttributeShorthand(vd1);

eq(
    vd1,
    ['hr', { name: 'blah', id: 'someid', 'class': 'someclass otherclass' }]
);



function isNested (v) {
    return v instanceof Array && v[0] instanceof Array;
}


function isTag (v) {
    return v instanceof Array && typeof v[0] === 'string';
}

function prepVDomTag (v) {

    if (!isTag(v)) { return v; }

    prepAttributeShorthand(v);
    prepChildren(v);

    return v;
}

function prepChildren (v) {

    var children = v.splice((toString.call(v[1]) === '[object Object]') ? 2 : 1, Infinity);

    // now v is just [tag, attrs] or [tag], and children is [vDom...]
    for (var i = 0; i < children.length; i++) { prepChild(v, children[i]); }

    return v;
}


function prepChild (ctx, child) {

    if (isNested(child)) {
        for (var i = 0; i < child.length; i++) { prepChild(ctx, child[i]); }

    } else {
        if (isTag(child))  { prepVDomTag(child); } 
        ctx.push(child);
    }
}




eq(
    prepChildren(['div', 'a', 'b', 'c']),
    ['div', 'a', 'b', 'c']
);

eq(
    prepChildren(['div', { id: 123 }, 'a', 'b', 'c']),
    ['div', { id: 123 }, 'a', 'b', 'c']
);

eq(
    prepChildren(['a', { name: 'name' }]),
    ['a', { name: 'name' }]
);

eq(
    prepChildren(['div', [['a', 'b'], ['a', 'c']]]),
    ['div', ['a', 'b'], ['a', 'c']]
);

eq(
    prepChildren(['div', 'text', [[[['a', 'text2']]]]]),
    ['div', 'text', ['a', 'text2']]
);

eq(
    prepChildren(['div', [[[['p', [['a', 'b']]], 'text', ['a', 'c'], 'text2']]]]),
    ['div', ['p', ['a', 'b']], 'text', ['a', 'c'], 'text2']
);



// in tohtml - check for self-closing tags? or keep null behaviour
// option to turn off prepVDom for performance


