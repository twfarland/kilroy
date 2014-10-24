(function () {


var root      = this,
    _toString = Object.prototype.toString,
    _slice    = Array.prototype.slice,
    _on, 
    _off;


if (document.body.addEventListener) {
    _on  = function (el, event, cb) { el.addEventListener(event, cb, false); };
    _off = function (el, event, cb) { el.removeEventListener(event, cb, false); };

} else {
    _on  = function (el, event, cb) { el.attachEvent('on' + event, cb); };
    _off = function (el, event, cb) { el.detachEvent('on' + event, cb); };
}


function each (obj, f) {
    for (var k in obj) f(obj[k], k);
}


function KilroyDef (conf) {
    return function KilroyCreate (opts) {
        return new Kilroy(opts, conf);
    };
}


function Kilroy (opts, conf) {

    var k = this;

    for (var p in conf) {
        if (k[p] !== undefined) throw new Error('Deft: ' + p + ' is a reserved property');
        if (conf.hasOwnProperty(p)) k[p] = conf[p];
    }

    k.init && k.init(opts);

    k.vDom = prepVDom(k.view(k));
    k.dom  = k.toHtml(k.vDom); 

    k.bindEvents(true);

    if (window.requestAnimationFrame && !k.noAnimate) animate(k);

    return k;
}


Kilroy.prototype.bindEvents = function (mode) {

    var k = this,
        eventName,
        events,
        method = (mode) ? _on : _off;

    each(k.events, function (events, eventName) {

        method(k.dom, eventName, function (evt) {

            var sel, cb;

            for (sel in events) {

                if ((sel[0] === '#' && evt.target.getAttribute('id') === sel.slice(1)) || // id
                    (sel[0] === '.' && (evt.target.className.split(/ +/).indexOf(sel.slice(1)) > -1)) || // class
                    (sel === evt.target.tagName.toLowerCase())) { // tagname 

                        cb = events[sel];
                        if (typeof cb === 'string') cb = k[cb];
                        cb.call(k, evt, evt.target);
                }
            }
        }); 
    });
};


function animate (k) {

    k.animating = true;

    function frame () {

        if (!k.rendering && k.dirty) {
            k.rendering = true;
            k.render();
            k.rendering = false;
            k.dirty     = false;
        } 
        window.requestAnimationFrame(frame);
    }

    frame();
}


Kilroy.prototype.d = function () {

    if (this.animating) {
        this.dirty = true;

    } else {
        this.render();
    }
};


Kilroy.prototype.render = function () {
    
    var k = this,
        vDomNew = prepVDom(k.view(k));

    k.update(k.dom, k.vDom, vDomNew);

    k.vDom = vDomNew;

    if (k.onUpdate) k.onUpdate();

    return k;
};


function prepVDom (v) { 

    if (!isTag(v)) return v; 

    // extract id and class from tag

    var tag = v[0].split(/\s+/); 

    if (tag.length > 1 || tag[0][0] === '#' || tag[0][0] === '.') {

        var attrs, a, attr, rest, el = 'div';

        if (_toString.call(v[1]) === '[object Object]') {
            attrs = v[1]; 
            rest  = 2;

        } else {
            attrs = {};
            rest  = 1;
        }

        for (a = 0; a < tag.length; a++) {

            attr = tag[a];

            if (attr[0] === '#') {
                attrs.id = attr.slice(1);

            } else if (attr[0] === '.') {
                attrs['class'] = (!attrs['class']) ? attr.slice(1) : attrs['class'] + ' ' + attr.slice(1);

            } else {
                el = attr;
            }   
        }

        v = [el, attrs].concat(v.slice(rest));
    }

    // flatten children 

    var res = [v[0]], i, child, c;

    for (i = 1; i < v.length; i++) {

        child = v[i];

        if (child instanceof Array && !isTag(child)) {
            for (c = 0; c < child.length; c++) {
                if (exists(child[c])) res.push(prepVDom(child[c]));
            }

        } else {
            if (exists(child)) res.push(prepVDom(v[i]));
        }
    }

    return res;
}


Kilroy.prototype.toHtmlStr = function (v) {

    var k = this;

    if (isTag(v)) { // tag

        var tag = v[0],
            obj = v[1],
            attrs = [], a,
            children, c, cLength,
            res;

        if (_toString.call(obj) === '[object Object]') {
            for (a in obj) {
                if (exists(obj[a]) && a[0] !== '_') attrs.push(a + '="' + obj[a] + '"');
            }
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

    } else if (v !== false && v !== null && typeof v !== 'undefined' && v.toString) {
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
    var DChildren = _slice.call(D.childNodes);
    var AChildren, AAttrs = {}, AAttr;
    var BChildren, BAttrs = {}, BAttr;
    var CAttrs = {}, CAttr;
    var d, a, b;
    var i;

    if (_toString.call(A[1]) === '[object Object]') {
        AAttrs    = A[1];
        AChildren = A.slice(2);
    } else {
        AChildren = A.slice(1);
    }

    if (_toString.call(B[1]) === '[object Object]') {
        BAttrs    = B[1];
        BChildren = B.slice(2);
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
        if (!exists(BAttrs[BAttr])) CAttrs[BAttr] = true;
    }

    for (CAttr in CAttrs) {
        if (CAttr === 'checked') {
            D.checked = false;
            
        } else {
            D.removeAttribute(CAttr);
        }
    }

    // child comparison: keyed, hash-based strategy

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

            if (AKeys[b[1]._key] === undefined) insertBeforeIndex(D, i, k.toHtml(b));
        }

    // child comparison: pairwise, naive strategy    

    } else { 

        for (i = 0; i < Math.max(AChildren.length, BChildren.length); i++) {

            d = DChildren[i];
            a = AChildren[i];
            b = BChildren[i];
            
            if (d === undefined && !exists(a) && exists(b)) { // no d/a, but b
                D.appendChild(k.toHtml(b)); 

            } else if (typeof d !== 'undefined' && exists(a) && !exists(b)) { // d/a, but no b
                D.removeChild(d);

            } else if (typeof d !== 'undefined' && exists(a) && exists(b)) { // both

                if ((isTag(a) && isTag(b))) { // tags

                    if (a[0] === b[0]) { // same tag, explore further
                        k.update(d, a, b);

                    } else {
                        D.replaceChild(k.toHtml(b), d); // different tag, regen, no need to explore further
                    }

                } else { // atoms
                    if (a !== b) {
                        D.replaceChild(k.toHtml(b), d);
                    }
                }
            }
        }
    }
};

function insertBeforeIndex(parent, i, child) {

    var next = parent.childNodes[i];

    if (next) {
        parent.insertBefore(child, next);
    } else {
        parent.appendChild(child);
    }
}

function isTag (v) {
    return v instanceof Array && typeof v[0] === 'string';
}

function exists (n) {
    if (n instanceof Array || typeof n === 'string') return n.length > 0;
    return !!(n === 0 || n);
}


root.Kilroy = KilroyDef;


}).call(this);