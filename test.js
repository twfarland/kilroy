


toString = Object.prototype.toString;
slice    = Array.prototype.slice;

function eq (a, b) {
    console.log(a);
    console.log(b);
}


// Preparing the vDom 

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

function prepVDomTag (v) {

    if (!isTag(v)) { return v; }

    prepAttributeShorthand(v);
    prepChildren(v);

    return v;
}

function prepChildren (v) {

    var children = v.splice((toString.call(v[1]) === '[object Object]') ? 2 : 1, Infinity);

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

// Utilities

function isNested (v) {
    return v instanceof Array && v[0] instanceof Array;
}

function isTag (v) {
    return v instanceof Array && typeof v[0] === 'string';
}

function exists (n) {
    if (n instanceof Array || typeof n === 'string') return n.length > 0;
    return !!(n === 0 || n);
}

function contains (arr, v) {
    for (var i = 0; i < arr.length; i++) { if (arr[i] === v) return true; }
}

function insertBeforeIndex (parent, i, child) { 

    var next = parent.childNodes[i];

    if (next) {
        parent.insertBefore(child, next);
    } else {
        parent.appendChild(child);
    }
}


// (prepared) vDom to html

function vDomToHtmlString (v, padder) {

    padder = padder || '';

    if (isTag(v)) { // tag

        var tag = v[0],
            obj = v[1],
            attrs = [], a,
            children, child, c, cLength,
            res;

        if (toString.call(obj) === '[object Object]') {
            for (a in obj) {
                if (exists(obj[a]) && a[0] !== '_') attrs.push(a + '="' + obj[a] + '"');
            }
            children = v.slice(2);

        } else {
            children = v.slice(1);
        }

        cLength = children.length;

        res = '<' + [tag].concat(attrs).join(' ') + '>';
        for (c = 0; c < cLength; c++) { res += vDomToHtmlString(children[c]); }
        if (cLength > 0) res += '</' + tag + '>'; 

        return res;

    } else if (typeof v === 'string') { // atom
        return v;

    } else if (v !== false && v !== null && typeof v !== 'undefined' && v.toString) {
        return v.toString();

    } else {
        return '';
    }
}


function htmlStringToDom (str) {

    var el = document.createElement('div');
    el.innerHTML = str;
    return el.firstChild;
};


function vDomToDom (v) {
    return htmlStringToDom(vDomToHtmlString(v));
}



// dom updating
// D = real dom, A = current vDom, B = new vDom

function updateDom (D, A, B) { 

    if (!D) return;

    var DChildren = slice.call(D.childNodes),
        AChildren, 
        BChildren;

    if (toString.call(A[1]) === '[object Object]') {
        AAttrs    = A[1];
        AChildren = A.slice(2);
    } else {
        AChildren = A.slice(1);
    }

    if (toString.call(B[1]) === '[object Object]') {
        BAttrs    = B[1];
        BChildren = B.slice(2);
    } else {
        BChildren = B.slice(1);
    }

    updateAttributes(D, AAttrs || {}, BAttrs || {});

    ((BChildren[0] && BChildren[0][1] && BChildren[0][1]._key) ? 
        updateChildrenKeyed : 
        updateChildrenPairwise)(D, DChildren, AChildren, BChildren);
};


// todo - check that it works properly with class attribute
function updateAttributes (D, AAttrs, BAttrs) {

    var BAttr, 
        CAttr, 
        CAttrs = {};

    for (BAttr in BAttrs) {

        if (!exists(BAttrs[BAttr])) {
            CAttrs[BAttr] = true;

        } else if (!exists(AAttrs[BAttr]) || AAttrs[BAttr] !== BAttrs[BAttr]) {

            if (BAttr === 'value' && D !== document.activeElement) {
                D.value = BAttrs[BAttr];

            } else if (BAttr === 'checked') { 
                D.checked = true;

            } else if (BAttr === 'selected') {
                D.selected = true; 

            } else if (BAttr.charAt(0) !== '_') {
                D.setAttribute(BAttr, BAttrs[BAttr]);

            } else if (BAttr = '_focus') {
                D.focus();
            }
        }
    }

    for (CAttr in CAttrs) {

        if (CAttr === 'value') {
            D.value = '';

        } else if (CAttr === 'checked') {
            D.checked = false;

        } else if (CAttr === 'selected') {
            D.selected = false;
            
        } else if (CAttr.charAt(0) !== '_') {
            D.removeAttribute(CAttr); 
            
        } else if (CAttr = '_focus') {
            D.blur();
        }
    }
}

function updateChildrenKeyed (D, DChildren, AChildren, BChildren) {

    var AKeys = {}, 
        AKey, 
        BKeys = {}, 
        BKey,
        d,
        a,
        b,
        i;

    for (i = 0; i < Math.max(AChildren.length, BChildren.length); i++) {

        d = DChildren[i];
        a = AChildren[i];
        b = BChildren[i];

        if (exists(a)) AKeys[a[1]._key] = d;
        if (exists(b)) BKeys[b[1]._key] = b;
    }

    for (AKey in AKeys) {
        if (BKeys[AKey] === undefined) D.removeChild(AKeys[AKey]);
    } 

    for (i = 0; i < BChildren.length; i++) {
        b = BChildren[i];
        if (AKeys[b[1]._key] === undefined) insertBeforeIndex(D, i, vDomToDom(b));
    }
}


function updateChildrenPairWise (D, DChildren, AChildren, BChildren) {

    var AKeys = {}, 
        AKey, 
        BKeys = {}, 
        BKey,
        d,
        a,
        b,
        i;

    for (i = 0; i < Math.max(AChildren.length, BChildren.length); i++) {

        d = DChildren[i];
        a = AChildren[i];
        b = BChildren[i];
        
        if (d === undefined && !exists(a) && exists(b)) { // no d/a, but b
            D.appendChild(vDomToDom(b)); 

        } else if (typeof d !== 'undefined' && exists(a) && !exists(b)) { // d/a, but no b
            D.removeChild(d);

        } else if (typeof d !== 'undefined' && exists(a) && exists(b)) { // both

            if ((isTag(a) && isTag(b))) { // tags

                if (a[0] === b[0]) { // isSameTagOrId() - same tag, explore further
                    updateDom(d, a, b);

                } else {
                    D.replaceChild(vDomToDom(b), d); // different tag, regen, no need to explore further
                }

            } else { // atoms
                if (a !== b) {
                    D.replaceChild(vDomToDom(b), d);
                }
            }
        }
    }
}





// vDomToHtmlString

eq(
    vDomToHtmlString(['hr']),
    '<hr>'
);

eq(
    vDomToHtmlString(['div', 'text']),
    '<div>text</div>'
);

eq(
    vDomToHtmlString(['div', 'a ', 'b ', 'c']),
    '<div>a b c</div>'
);

eq(
    vDomToHtmlString(['div', 0, 0, undefined, 0]),
    '<div>000</div>'
);

eq(
    vDomToHtmlString(['div', { id: 'someid', 'class': 'someclass' }, 123]),
    '<div id="someid" class="someclass">123</div>'
);


// htmlStringToDom

console.log(htmlStringToDom('<div>000</div>'));
console.log(htmlStringToDom('<div>a b c</div>'));
console.log(htmlStringToDom('<div id="someid" class="someclass">123</div>'));
console.log(htmlStringToDom('<hr>'));





// ------ TESTS ----



// prepAttributeShorthand

eq(
    prepAttributeShorthand(['#someid .someclass', 123]),
    ['div', { id: 'someid', 'class': 'someclass' }, 123]
);

eq(
    prepAttributeShorthand(['div', 123]),
    ['div', 123]
);

eq(
    prepAttributeShorthand(['hr #someid .someclass .otherclass', { name: 'blah' }]),
    ['hr', { name: 'blah', id: 'someid', 'class': 'someclass otherclass' }]
);

// prepChildren

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



// in tohtml and update - check for self-closing tags? or keep null behaviour

// option to turn off prepVDom for performance


