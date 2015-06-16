
// Lists html5 void elements which can not be closed

var voidElements = { area:1, base:1, br:1, col:1, command:1, embed:1, hr:1, img:1, input:1, keygen:1, link:1, meta:1, param:1, source:1, track:1, wbr:1 };

// vDomNode -> vDomNode
// mutates the given vDomNode. This must be done before any actual dom updating

function prepVDomTag (v) {

    if (!isTag(v)) { return v; }

    prepAttributeShorthand(v);
    prepChildren(v);

    return v;
}

// vDomNode -> vDomNode
// mutates the given vDomNode. Maps shorthand id and class attributes to proper attributes

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

// vDomNode -> vDomNode
// mutates the given vDomNode. Flattens nested children

function prepChildren (v) {

    var children = v.splice((toString.call(v[1]) === '[object Object]') ? 2 : 1, Infinity);

    for (var i = 0; i < children.length; i++) { prepChild(v, children[i]); }

    return v;
}

// vDomNode, vDomNode -> _
// pushes a single vDom child into it's parent context, after preparing it

function prepChild (ctx, child) {

    if (isNested(child)) {
        for (var i = 0; i < child.length; i++) { prepChild(ctx, child[i]); }

    } else {
        if (isTag(child))  { prepVDomTag(child); } 
        ctx.push(child);
    }
}

// vDomNode -> HtmlString

function vDomToHtmlString (v) {

    if (isTag(v)) { // tag

        var tag = v[0],
            obj = v[1],
            attrs = [], 
            a,
            children, 
            child, 
            c,
            res;

        if (toString.call(obj) === '[object Object]') {
            for (a in obj) {
                if (exists(obj[a]) && a[0] !== '_') { attrs.push(a + '="' + obj[a] + '"'); }
            }
            children = v.slice(2);

        } else {
            children = v.slice(1);
        }

        res = '<' + [tag].concat(attrs).join(' ') + '>';

        if (!voidElements[tag]) {
            for (c = 0; c < children.length; c++) { res += vDomToHtmlString(children[c]); }
            res += '</' + tag + '>'; 
        }

        return res;

    } else if (typeof v === 'string') { // atom
        return v;

    } else if (v !== false && v !== null && typeof v !== 'undefined' && v.toString) {
        return v.toString();

    } else {
        return '';
    }
}

// HtmlString -> DomNode

function htmlStringToDom (str) {

    var el = document.createElement('div');
    el.innerHTML = str;
    return el.firstChild;
};

// vDomNode -> DomNode
// vDoms must be prepared with prepVDomTag

function vDomToDom (v) {
    return htmlStringToDom(vDomToHtmlString(v));
}

// DomNode, vDom, vDom -> _  
// dom updating
// D = real dom, A = current vDom, B = next vDom
// vDoms must be prepared with prepVDomTag

function updateDom (D, A, B) { 

    if (!D) return;

    var DChildren = slice.call(D.childNodes),
        AChildren, 
        BChildren,
        AAttrs = {},
        BAttrs = {};

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

    updateAttributes(D, AAttrs, BAttrs);

    ((BChildren[0] && BChildren[0][1] && BChildren[0][1]._key) ? 
        updateChildrenKeyed : 
        updateChildrenPairwise)(D, DChildren, AChildren, BChildren);
};


// DomNode, { attr: val... }, { attr: val... } -> _
// Update the attributes from the new vDom (b) in the old Dom (b) by comparing 
// with attributes of the current vDom (a).
// If it's in a but not in b, it should be removed from d.
// If it's in b, it should be set in d.

function updateAttributes (D, AAttrs, BAttrs) {

    var AAttr, BAttr;

    for (AAttr in AAttrs) {

        if (!exists(BAttrs[AAttr])) {

            if (AAttr === 'value') {
                D.value = '';

            } else if (AAttr === 'checked') {
                D.checked = false;

            } else if (AAttr === 'selected') {
                D.selected = false;
                
            } else if (AAttr.charAt(0) !== '_') {
                D.removeAttribute(AAttr); 
                
            } else if (AAttr = '_focus') {
                D.blur();
            }
        }
    } 

    for (BAttr in BAttrs) {

        if (BAttr === 'value' && D !== document.activeElement) {
            D.value = BAttrs[BAttr];

        } else if (BAttr === 'checked') { 
            D.checked = !!BAttrs[BAttr];

        } else if (BAttr === 'selected') {
            D.selected = !!BAttrs[BAttr]; 

        } else if (BAttr.charAt(0) !== '_') {
            D.setAttribute(BAttr, BAttrs[BAttr]);

        } else if (BAttr = '_focus') {
            D.focus();
        }
    }
}

// DomNode, [DomNode...], [VDom...], [VDom...] -> _
// Updates the children in the Dom with a naive strategy
// This is the default strategy

function updateChildrenPairwise (D, DChildren, AChildren, BChildren) {

    var AKeys = {}, 
        AKey, 
        BKeys = {}, 
        BKey,
        d,
        a,
        b,
        i,
        existsA,
        existsB,
        existsD;

    for (i = 0; i < Math.max(AChildren.length, BChildren.length); i++) {

        d = DChildren[i];
        a = AChildren[i];
        b = BChildren[i];
        existsA = exists(a);
        existsB = exists(b);
        existsD = typeof d !== 'undefined';
        
        if (!existsD && !existsA && existsB) { // no d/a, but b
            D.appendChild(vDomToDom(b)); 

        } else if (existsD && existsA && !existsB) { // d/a, but no b
            D.removeChild(d);

        } else if (existsD && existsA && existsB) { // both

            if ((isTag(a) && isTag(b))) { // tags

                if (hasSameTagAndId(a, b)) { // explore further
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

// DomNode, [DomNode...], [VDom...], [VDom...] -> _
// Updates the children in the Dom with a hash-based, keyed strategy
// This is used if the children have unique _key properties
// The _key properties must faithfully represent the entire state of the 
// child and all its attributes/children

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
