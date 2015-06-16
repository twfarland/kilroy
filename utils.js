// Utilities

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