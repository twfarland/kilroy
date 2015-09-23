var Todos = Kilroy({

    init: function (todos) {
        this.todos = todos || [];
    },

    view: function () {
        
        var todos = this.todos;
        
        return ['#todos',
            ['h3', 'Todos'],
            ['input .new-todo', { placeholder: 'New todo ...' }],
            ['ul', todos.map(function (todo, i) {
                return ['li', { _key: todo.text + i },
                    ['span', todo.text], 
                    ['a .del', { href: '#' + i }, ' [&times;]']]; })]];
    },

    addTodo: function (text) {
        this.todos.push({ text: text, done: false });
        this.d();
    },

    delTodo: function (i) {
        this.todos.splice(i, 1);
        this.d();
    },

    events: {
        keyup: { 
            '.new-todo': function (a) {
                if (a.evt.which !== 13 && a.evt.keyCode !== 13) return;
                this.addTodo(a.el.value);
                a.el.value = '';
            } 
        },
        click: { 
            '.del': function (a) {
                this.delTodo(a.el.getAttribute('href').slice(1));
            } 
        }
    }
});

document.body.appendChild(Todos().node);