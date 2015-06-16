
function eq (a, b) {
    console.log(a);
    console.log(b);
}

eq(
    hasSameTagAndId(['div', 1], ['div', 2]),
    true
);

eq(
    hasSameTagAndId(['a', 1], ['div', 2]),
    false
);

eq(
    hasSameTagAndId(['div', { id: 123 }, ''], ['div', { id: 123 }, '']),
    true
);

eq(
    hasSameTagAndId(['div', { id: 123 }, ''], ['div', { id: 456 }, '']),
    false
);

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


// vDomToDom

// attributes

var a1 = ['div', { 'data-x': 'x' }, 'x'];
var b1 = ['div', { 'data-y': 'y' }, 'y'];
var v1 = vDomToDom(a1);

document.body.appendChild(v1);

var a2 = ['div', 'x'];
var b2 = ['div', { 'data-y': 'y' }, 'y'];
var v2 = vDomToDom(a2);

document.body.appendChild(v2);

var a3 = ['div', { 'data-x': 'x' }, 'x'];
var b3 = ['div', 'y'];
var v3 = vDomToDom(a3);

document.body.appendChild(v3);

var a4 = ['div', { 'data-x': 'x', 'data-y': 'y' }, 'x'];
var b4 = ['div', { 'data-z': 'z', 'data-y': 'y' }, 'y'];
var v4 = vDomToDom(a4);

document.body.appendChild(v4);

var a5 = ['input', { type: 'checkbox', checked: true }];
var b5 = ['input', { type: 'checkbox', checked: false, _focus: true }];
var v5 = vDomToDom(a5);

document.body.appendChild(v5);

var a6 = ['select', 
    ['option', { value: 1, selected: true }, 1],
    ['option', { value: 2}, 2]];
var b6 = ['select', 
    ['option', { value: 1 }, 1],
    ['option', { value: 2, selected: true }, 2]];
var v6 = vDomToDom(a6); 

document.body.appendChild(v6);

// children - basic      

var a7 = ['div'];
var b7 = ['div', 123];
var v7 = vDomToDom(a7);

document.body.appendChild(v7);

var a8 = ['div', 456];
var b8 = ['div'];
var v8 = vDomToDom(a8);

document.body.appendChild(v8);

var a9 = ['div', 789];
var b9 = ['div', 987];
var v9 = vDomToDom(a9);

document.body.appendChild(v9);

var a10 = ['div', ['div', ['div', 'a']], ['div', 'b'], 'c'];
var b10 = ['div', 'a', ['div', 'b'], ['div', ['div', 'c']]];
var v10 = vDomToDom(a10);

document.body.appendChild(v10);

// children - keyed

var a11 = ['div', 
    ['div', { _key: 1 }, 1],
    ['div', { _key: 2 }, 2]];
var b11 = ['div', 
    ['div', { _key: 2 }, 2],
    ['div', { _key: 3 }, 3]];
var v11 = vDomToDom(a11);

document.body.appendChild(v11);

document.body.addEventListener('click', function () {
    updateDom(v1, a1, b1);
    updateDom(v2, a2, b2);
    updateDom(v3, a3, b3);
    updateDom(v4, a4, b4);
    updateDom(v5, a5, b5);
    updateDom(v6, a6, b6);  
    updateDom(v7, a7, b7); 
    updateDom(v8, a8, b8); 
    updateDom(v9, a9, b9); 
    updateDom(v10, a10, b10); 
    updateDom(v11, a11, b11); 
}, false); 


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

// Utils

eq(
    isTag(['div', 123]),
    true
);

eq(
    isTag(123),
    false
);

eq(
    isNested([[]]), 
    true
);

eq(
    isNested(['div']),
    false
);