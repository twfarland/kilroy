(function () {


var root      = this,
    _toString = Object.prototype.toString,
    _slice    = Array.prototype.slice,
    _on       = 'addEventListener', _off = 'removeEventListener';

if (!document.addEventListener) _on  = 'attachEvent', _off = 'detachEvent';

function each (obj, f) {
    for (var k in obj) f(obj[k], k);
}



function KilroyDef (conf) {

    return function KilroyCreate (opts) {

        return new Kilroy(opts, conf);
    }
}


function Kilroy (opts, conf) {

    var k = this;

    k.dirty     = false;
    k.vDom      = null;
    k.dom       = null;
    k.rendering = false;

    for (var p in conf) {
        if (!(k[p] === undefined)) throw new Error('Kilroy: "' + p + '"" is a reserved property');
        if (conf.hasOwnProperty(p)) k[p] = conf[p];
    }

    k.init(k, opts);
    k.updater();

    return k;
}


Kilroy.prototype.updater = function () {

    var k = this;

    k.vDom = flattenVDom(k.view(k));
    k.dom  = k.toHtml(k.vDom); 

    k.bindEvents(true);

    function animate () {
        window.requestAnimationFrame(animate);
        render(k);
    }

    animate();
};


function render (k) {

    var vDomNew;

    if (k.dirty && !k.rendering) {

        k.rendering = true;
        vDomNew     = flattenVDom(k.view(k));

        k.update(k.dom, k.vDom, vDomNew);

        k.vDom      = vDomNew;
        k.dirty     = false;
        k.rendering = false;
    }
};



Kilroy.prototype.bindEvents = function (mode) {

    var k = this,
        eventName,
        events,
        method = (mode) ? 'addEventListener' : 'removeEventListener';

    each(k.events, function (events, eventName) {

        k.dom[method](eventName, function (evt) {

            for (var sel in events) {

                if ((sel[0] === '#' && evt.target.getAttribute('id') === sel.slice(1)) || // id
                    (sel[0] === '.' && (evt.target.className.split(/ +/).indexOf(sel.slice(1)) > -1)) || // class
                    (sel === evt.target.tagName.toLowerCase())) { // tagname 

                    k[events[sel]].call(evt.target, k, evt);
                }
            }

        }, true); 
    });
};


Kilroy.prototype.set = function () {

    var k          = this,
        ref        = this,
        path       = _slice.call(arguments),
        pathLength = path.length;

    while (pathLength > 2) ref = ref[path[0]];

    ref[path[0]] = path[1];

    k.dirty = true;
};


function flattenVDom (v) {

   if (!(v instanceof Array && typeof v[0] === 'string')) return v; 

   var res = [v[0]], i, child, c;

   for (i = 1; i < v.length; i++) {

        child = v[i];

        if (child instanceof Array && child[0] instanceof Array) {
            for (c = 0; c < child.length; c++) {
                if (exists(child[c])) res.push(flattenVDom(child[c]));
            }

        } else {
            if (exists(v[i])) res.push(flattenVDom(v[i]));
        }
   }

   return res;
}


Kilroy.prototype.toHtmlStr = function (v) { // v must be flattened

    var k = this;

    if (v instanceof Array && typeof v[0] === 'string') { // tag

        var tag = v[0],
            obj = v[1],
            attrs = [], a,
            children, c, cLength,
            res;

        if (_toString.call(obj) === '[object Object]') {
            for (a in obj) exists(obj[a]) && a[0] !== '_' && attrs.push(a + '="' + obj[a] + '"');
            children = v.slice(2);

        } else {
            children = v.slice(1);
        }

        cLength = children.length;

        res = '<' + [tag].concat(attrs).join(' ') + '>';
        for (c = 0; c < cLength; c++) res += k.toHtmlStr(children[c]);
        if (cLength > 0) res += '</' + tag + '>'; 

        return res;

    } else if (typeof v === 'string') { // atom
        return v;

    } else if (v !== false && v !== null && !(v === undefined) && v.toString) {
        return v.toString();

    } else {
        return '';
    }
};


Kilroy.prototype.toHtml = function (v) { // v must be flattened

    var el = document.createElement('div');
    el.innerHTML = this.toHtmlStr(v);
    return el.firstChild;
};


// D is current real dom node
// A is current virtual dom node
// B is new virtual dom node


Kilroy.prototype.update = function (D, A, B) { 

    if (!D) return;

    var k = this;
    var DChildren = [].slice.call(D.childNodes);
    var AChildren, AAttrs = {}, AAttr;
    var BChildren, BAttrs = {}, BAttr;
    var d, a, b;
    var i;

    if (_toString.call(A[1]) === '[object Object]') {
        AAttrs = A[1], AChildren = A.slice(2);
    } else {
        AChildren = A.slice(1);
    }

    if (_toString.call(B[1]) === '[object Object]') {
        BAttrs = B[1], BChildren = B.slice(2);
    } else {
        BChildren = B.slice(1);
    }


    // update attributes

    for (BAttr in BAttrs) {
        if (BAttr === 'checked') { 
            D.checked = !!BAttrs[BAttr];

        } else if (!exists(AAttrs[BAttr]) || AAttrs[BAttr] !== BAttrs[BAttr]) {
            D.setAttribute(BAttr, BAttrs[BAttr]);
        }
        if (exists(BAttrs[BAttr])) delete AAttrs[BAttr];
    }

    for (AAttr in AAttrs) {
        if (AAttr === 'checked') {
            D.checked = false;
        } else {
            D.removeAttribute(AAttr);
        }
    }


    // child comparison

    // keyed, hash-based strategy

    if (BChildren[0] && BChildren[0][1] && BChildren[0][1]._key) { 

        var AKeys = {}, AKey, BKeys = {}, BKey;

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

            if (d = AKeys[b[1]._key]) {
                D.appendChild(D.removeChild(d));

            } else {
                D.appendChild(k.toHtml(b));
            }
        }

    // pairwise, naive strategy    

    } else { 

        for (i = 0; i < Math.max(AChildren.length, BChildren.length); i++) {

            d = DChildren[i];
            a = AChildren[i];
            b = BChildren[i];
            
            if (d === undefined && !exists(a) && exists(b)) {
                D.appendChild(k.toHtml(b));

            } else if (!(d === undefined) && exists(a) && !exists(b)) { 
                D.removeChild(d);

            } else if (!(d === undefined) && exists(a) && exists(b)) { // both

                if (a instanceof Array && b instanceof Array && typeof a[0] === 'string' && typeof b[0] === 'string') { // tags

                    if (a[0] === b[0]) { // same tag, explore further
                        k.update(d, a, b);

                    } else {
                        D.replaceChild(k.toHtml(b), d); // different tag, regen, no need to explore further
                    }

                } else if (a !== b) { // atoms
                    D.replaceChild(k.toHtml(b), d);
                }
            } 
        }
    }
};


function exists (n) {
    if (n instanceof Array || typeof n === 'string') return !!n.length > 0;
    return !!(n === 0 || n);
}




root.Kilroy = KilroyDef;


}).call(this);