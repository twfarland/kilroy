(function () {

'use strict';

// ---------- Utils ----------   

var root        = this;
var toString    = Object.prototype.toString;
var slice       = Array.prototype.slice;
var _on, _off;

if (document.body.addEventListener) {
    _on  = function (el, event, cb) { el.addEventListener(event, cb, false); };
    _off = function (el, event, cb) { el.removeEventListener(event, cb, false); };

} else {
    _on  = function (el, event, cb) { el.attachEvent('on' + event, cb); };
    _off = function (el, event, cb) { el.detachEvent('on' + event, cb); };
}

try {
    slice.call(document.body.childNodes);

} catch (e) {
    slice = function () {
        var res = [], i;
        for (i = 0; i < this.length; i++) { res.push(this[i]); }
        return res;    
    };
}

// { *: * }, (* -> *) -> _

function each (obj, f) {
    for (var k in obj) f(obj[k], k);
}

// vDomNode -> Bool
// test whether the node starts with an array within an array

function isNested (v) {
    return v instanceof Array && v[0] instanceof Array;
}

// vDomNode -> Bool
// test whether the node has a valid 'tag' structure

function isTag (v) {
    return v instanceof Array && typeof v[0] === 'string';
}

// vDomNode -> Bool
// test whether the node is i.e. is a number or longer than zero

function exists (n) {
    if (n instanceof Array || typeof n === 'string') return n.length > 0;
    return !!(n === 0 || n);
}

// [*...], * -> Bool
// test whether the value is in the array, by ===

function contains (arr, v) {
    for (var i = 0; i < arr.length; i++) { if (arr[i] === v) return true; }
}

// DomNode, Int, DomNode -> _
// inserts the child in the parent at index

function insertBeforeIndex (parent, i, child) { 

    var next = parent.childNodes[i];

    if (next) {
        parent.insertBefore(child, next);
    } else {
        parent.appendChild(child);
    }
}

// vDomTag, vDomTag -> Bool 
// are the two tags of the same type, and if they have an id, is it the same?

function hasSameTagAndId (a, b) { 

    var hasId = toString.call(a[1]) === '[object Object]' && toString.call(b[1]) === '[object Object]' && a[1].id && b[1].id;

    return a[0] === b[0] && (!hasId || (hasId && a[1].id === b[1].id));
}

// ---------- Virtual Dom ----------

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
        if (exists(child)) { ctx.push(child); }
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
}

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
        
    if (toString.call(B[1]) === '[object Object]') {
        BAttrs    = B[1];
        BChildren = B.slice(2);
    } else {
        BChildren = B.slice(1);
    }

    if (BAttrs._noUpdate) { return; }

    if (toString.call(A[1]) === '[object Object]') {
        AAttrs    = A[1];
        AChildren = A.slice(2);
    } else {
        AChildren = A.slice(1);
    }

    updateAttributes(D, AAttrs, BAttrs);

    ((BChildren[0] && BChildren[0][1] && BChildren[0][1]._key) ? 
        updateChildrenKeyed : 
        updateChildrenPairwise)(D, DChildren, AChildren, BChildren);
}


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
                
            } else if (AAttr === '_focus') {
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

        } else if (BAttr === '_focus') {
            D.focus();
        }
    }
}

// DomNode, [DomNode...], [VDom...], [VDom...] -> _
// Updates the children in the Dom with a naive strategy
// This is the default strategy

function updateChildrenPairwise (D, DChildren, AChildren, BChildren) {

    var d, a, b,
        existsD, existsA, existsB,
        i;

    for (i = 0; i < Math.max(AChildren.length, BChildren.length); i++) {

        d = DChildren[i];
        a = AChildren[i];
        b = BChildren[i];
        existsD = typeof d !== 'undefined';
        existsA = exists(a);
        existsB = exists(b);
        
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

    var d, a, b, i, AKeys = {}, AKey, BKeys = {}, BKey;

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

// vDom, Kilroy -> _

function render (v, k, cback) {

    if (!v.node) {
        v.virtual = prepVDomTag(v.view.call(k));
        v.node    = vDomToDom(v.virtual);

    } else {
        var virtualNew = prepVDomTag(v.view.call(k));
        updateDom(v.node, v.virtual, virtualNew);
        v.virtual = virtualNew;
    }

    if (cback) { cback.call(k); }
}

// vDom, Kilroy -> _

function animate (v, k) {

    v.animating = true;

    function frame () {

        if (!v.rendering && v.isDirty) {
            v.rendering = true;
            render(v, k, k._cback);
            delete v.rendering;
            delete v.isDirty;
            delete k._cback;
        } 
        window.requestAnimationFrame(frame);
    }

    frame();
}

// vDom, Kilroy -> _

function dirty (v, k, cback) {

    if (v.animating) {
        v.isDirty = true;
        k._cback  = cback;

    } else {
        render(v, k, cback);
    }
}

// * -> vDomNode, { *: * } -> VDom
// constructs a vDom

function vDom (view, k) {

    var v = {
        view:       view,
        virtual:    null,
        node:       null,
        animating:  false,
        rendering:  false,
        isDirty:    true
    };

    if (window.requestAnimationFrame && !k.noAnimate) { animate(v, k); } else { render(v, k); }

    return v;
}

// ---------- Event binding ----------

// VDom, Kilroy -> _
// Binds a map of events in Kilroy object on the dom
// each event receives an action object: { el: targetElement, event: currentEvent } 
// { event: { selector: ((action) -> _) } }

function bindDomEvents (v, k) {

    var eventName, events;

    each(k.events, function (events, eventName) {

        _on(v.node, eventName, function (evt) {

            evt = evt || window.event;

            if (!evt.preventDefault) evt.preventDefault = function () { evt.returnValue = false; };

            var sel, cb, target = evt.target || evt.srcElement;

            for (sel in events) {

                if ((sel.charAt(0) === '#' && target.getAttribute('id') === sel.slice(1)) || // id
                    (sel.charAt(0) === '.' && contains(target.className.split(/ +/), sel.slice(1))) || // class
                    (sel === target.tagName.toLowerCase())) { // tagname 

                        cb = events[sel];
                        if (typeof cb === 'string') cb = k[cb];
                        cb.call(k, { evt: evt, el: target });
                }
            }
        }); 
    });
}

// ---------- Constructor ----------

// { init: * -> _, view: _ -> vDomNode, events: { eventName: { selector: action -> _ }}}
// defines a Kilroy component

function Kilroy (base) {
 
    if (!base.view) { throw new Error("A 'view' property is required"); }

    // * -> Kilroy
    // creates an instance of a Kilroy component

    return function (data) {

        var k = {};

        for (var p in base) {
            if (base.hasOwnProperty(p)) { k[p] = base[p]; }
        }

        if (k.init) { k.init(data); }

        var v = vDom(k.view, k);

        k.node = v.node;
        k.d    = function (cback) { dirty(v, k, cback); };

        if (k.events) { bindDomEvents(v, k); }

        return k;
    };
}

root.Kilroy = Kilroy;

root.KilroyUnits = {};

var toExpose = [

	// utils
	isNested, isTag, exists, contains, insertBeforeIndex, hasSameTagAndId,

	// vDom
	prepVDomTag, prepAttributeShorthand, prepChildren, prepChild, 
	vDomToHtmlString, htmlStringToDom, vDomToDom, 
	updateDom, updateAttributes, updateChildrenPairwise, updateChildrenKeyed
];

for (var i = 0; i < toExpose.length; i++) {
	root.KilroyUnits[toExpose[i].name] = toExpose[i];
}

}).call(this);