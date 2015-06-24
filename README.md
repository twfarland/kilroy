# Kilroy

A tiny, fast javascript ui library inspired by [React.js](http://facebook.github.io/react/).

Creator: Tim Farland twfarland@gmail.com

## Current version

	0.1.1

## Installation

	npm install kilroy

## Features / benefits

- Uses a virtual dom to minimise expensive real dom manipulation.
- One-way data binding.
- No compilation step necessary.
- Async rendering using requestAnimationFrame.
- Views are made from simple javascript literals.
- Tiny (~2kb minified/gzipped).
- No dependencies.
- Generates clean html.
- Supports modern browsers and IE9+, IE8 support is possible with a workaround.
- Unit-tested, simple code.
- Small api, very few concepts to learn.

By design, it does not have these [React.js](http://facebook.github.io/react/) features:

- Synthetic events system.
- Child components.
- JSX.

## Overview

Kilroy owes most of its design to [React.js](http://facebook.github.io/react/). The following descriptions of the virtual dom have prior art in the React project.

Kilroy exposes one variable to the global namespace - `Kilroy`. This is used to construct UI components, which contain a view, 
event bindings, and any other data or methods the programmer requires:

```javascript
var Todos = Kilroy({
	init: function () { ... },
	view: function () { ... },
	events: { ... }
});
```

### The view

The heart of the component is the view function. It returns simple javascript literals in a form isomorphic to html. 
This embedding approach is inspired by the lisp practice of using s-expressions to generate html. 

Here is a typical view:

```javascript
function () {

	return ['div', { id: 'todos' },
				['h1', 'Todo list'],
				['p', 'Items remaining: ' + this.todos.length],
				['ul',	
					this.todos.map(function (todo, idx) {  
						return ['li', 
									todo, 
									['input', { type: 'checkbox', name: 'todo-' + idx }]]; 
					})];
}
```

Tags are represented as javascript arrays, with the tag name as a string in the first position, attributes in an object literal in the
second position, and any child elements after that. Text nodes are represented by strings or number literals. See [view grammar](#view-grammar) for more detail.

This allows us to interpolate data with 'html' freely while using the full power of javascript to generate views. 
There is no parsing/compilation step or special templating syntax to learn.

When the component is initialised with this view, it is mapped to an html string, from which an initial real dom node is generated.

Id and class css selector shorthand is also supported on the tag name, and if the tag name is omitted, a div is implied e.g:

```javascript
['div #main .container .active', 'text']

	// expands to:

['div', { id: 'main', class: 'container active' }, 'text']
```

### Updating the view

The generated dom is not manipulated directly. It is treated as a rendering target. 

When any data referenced in the view function is changed, the `.d()` method may be called to update the view.

Kilroy does not not 'watch' for changes on this data and update the view automatically, as the 'dirty' checking happens in the view, 
rather than the model. This allows for a more flexible inclusion of data in the view, and gives the programmer control of when to update.

So when `.d()` is called on the component, Kilroy runs the entire view function again, generating a current view state as a virtual dom.
But this time, it doesn't create an entirely new real dom node. It **compares** the previously generated virtual dom with the new one, 
calculates their difference, performs the minimal number of real dom manipulations necessary to update the real dom, and replaces the currently stored
virtual dom with the new one. Heuristics and manual performance tuning help make this fast.

So the programmer no longer needs to reason about view state. They can just describe how they want the view to look with given data, 
as if they were rendering the view on a server as flat html.

By default, `.d()` is asynchronous and non-blocking - it marks the view as 'dirty', but the actual rendering runs in an external `requestAnimationFrame` loop. 
So if you need to do something immediately after a render, you must pass in a callback to `.d()`, e.g: `this.d(function () { ...doSomething... })`.

### Binding events

Kilroy uses event delegation only. Events are bound on the root real dom node, and may be bound by simple selectors: tag, id, or class.
In practice, complex selectors are not necessary. On definition, pass in a map of events to selectors to callbacks, e.g:

```javascript
events: {
	click: {
		a: function (ctx) { // selected by tag name
			this.active = ctx.el.getAttribute('href');
			this.d();
		},
		'#some-id': function (ctx) { ... }, // selected by id
		'.some-class': function (ctx) { ... } // selected by class
	},
	change: { 
		input: function (ctx) { ... },
		// other selectors  ...
	},
	// other event types ...
}

```

An action context object is passed as a parameter to each callback. This contains the event `.event` and it's target `.el`. 
Each callback is called within the Kilroy component instance itself, so `this.d()` can be called from inside them.

These are vanilla javascript events, so the programmer needs to know them well (see [quirks mode](http://www.quirksmode.org/dom/events/index.html) for compatibility reference), or use jQuery instead of Kilroy's internal event binder.

### Initialisation

Here is a complete example, showing definition with the three main properties, initialisation of an instance, and place of the dom node of that instance on a page.

```javascript
var Counter = Kilroy({ 
	init: function (count) {
		this.count = count;
	},
	view: function () {
		return ['div', 
					['b', 'Count: ' + this.count], 
					['.incr', '[+]']]; 
	},
	events: {
		click: { 
			'.incr': function () { 
				this.count++;
				this.d();
			} 
		}
	}
});

var counter = Counter(0);

document.body.appendChild(counter.node);
```

## More examples

Basic examples can be found in the `/examples` directory of this repo.

For a more complex example, see the [Kilroy Todo MVC implementation](https://github.com/twfarland/todomvc-kilroy).




## Manual performance tuning

For most usage, Kilroy will be more than fast enough without any tweaking. But if you want greater control, try these features:

<a name="unique-keys"></a>
### Unique keys

By default, Kilroy does pairwise comparison on a tag's child nodes. This is efficient when modifying the end of the list of children,
but expensive when modifying the start (it will have to perform replacements for each child).

For lists of children that are subject to additions, removal, or reordering, with nothing or very little changing within them, it is suitable to use
the `_key` property. This will allow Kilroy to compare the sets of keys in the current and new virtual doms, determining only which ones
to pluck out and which to add.

To use this, just include a `_key` property in the attributes of each child (properties starting with `_` are special and will not be included in the generated html).

```javascript
['.parent',
	['.child', { _key: 1 }, 1],
	['.child', { _key: 2 }, 2]
	['.child', { _key: 3 }, 3]];
```

These keys **must be unique** within their set of siblings and they must **uniquely represent the total view state of the child and all it's children.**
This can be tricky to get right, but use this rule of thumb: If any data shown in the child or any of its children is subject to change, it should somehow be included in the key.

<a name="no-update"></a>
### Preventing unnecessary exploration

The updating function first updates the attributes on each tag it encounters. It then proceeds to update any of that tag's
children if they have the same tag and the same or no id.

If they have a different tag or id, the dom for that whole branch is regenerated from scratch, rather than updated.

If the children are keyed, none of this is applied, because the key represents the state of the tag and all its children. 
Any children in the new virtual dom that are not in the current are fully regenerated from scratch.

However, you can force the updating function to terminate early on a tag by including the `_noUpdate` property in its attributes, e.g:

```javascript
['div', { _noUpdate: true },
	['p', 'This content has not changed and will not be explored during the next update']]
```

Neither the tag's attributes nor its children will be updated.

This is useful for declaring parts of the component that remain static, and can be safely ignored by the update function.

### Disabling animation

By default, each Kilroy instance runs it's rendering in a `requestAnimationFrame` loop. Calling `.d()` marks the instance as 'dirty', 
so an update will be triggered on the next loop. When that is complete, it will be marked as clean. This is asynchronous.

You can turn this loop off by defining the component with `_noAnimate: true`. Then, calls to `.d()` will simply call the update function once,
blocking until it is done.

<a name="view-grammar"></a>
## View grammar

A virtual dom returned by the `view` function must be javascript objects adhering to the following form:

	vDomNode =
		vDomTag | vDomAtom | [vDomNode...]

	vDomAtom =
		String | Number

	vDomTag =
		[Tag] |
		[Tag, Attrs] |
		[Tag, Attrs, vDomNode...] |
		[Tag, vDomNode...]

	Tag =
		"tag #id? .class*"

	Attrs =
		{ String: Prop }

	Prop =
		String | Number | Boolean

#### Special attributes on virtual dom tags

`_focus` - Boolean. Sets focus on the element after the next render. Can apply to one element in the view at most.

`_key` - See [unique keys](#unique-keys)

`_noUpdate` - See [preventing unnecessary exploration](#no-update)

## Api

Consists of one function, `Kilroy`, which defines a component **constructor.**

	var Component = Kilroy({

		// required

		view: function () {},

		// optional

		init: function (any...) {},

		events: {
			eventName: {
				selector: function (context) { }
			}
		},

		_noAnimate: bool,

		// other, arbitrary properties and methods can be defined
	});

The event callbacks receive an action context which has:

`.el` - the target element

`.event` - the target event

The event name is any valid javascript event. 
The selector is either a tag name, #id, or .class.	

When the **constructor** is called with any initial data, it returns an **instance:**

	var component = Component(any...);

An **instance** has all of the properties defined in the constructor, plus:

`.node` - the real dom node

`.d(callback)` - marks the component as 'dirty', scheduling an update

## Making it work with older browsers

#### IE8 Events

In IE8, some events do not bubble (e.g: form submit, input change). See [quirks mode](http://www.quirksmode.org/dom/events/index.html) for details. Because Kilroy uses event delegation only, these events will not register.

The solution is to either design your components to avoid usage of these problematic events, or to use jQuery's event delegation instead of the built-in `events` property, e.g:

```javascript

var MyComponent = Kilroy({
	view: function () {
		return ['div', 
					['b', this.formData],
					['form',
						['input', { name: 'data' }],
						['input', { type: 'submit', value: 'submit' }]]];
	}
	// no 'events' property is included
});

var myInstance = MyComponent();

$(myInstance.node).on('submit', 'form', function () {
	myInstance.formData = $(this).serialize();
	myInstance.d();
});

```

In general, it is fine to use jQuery with Kilroy anyway, as long as you don't manipulate the real dom node directly.

#### requestAnimationFrame

You can use a polyfill for this if you need it.

## License

Do what you want.
