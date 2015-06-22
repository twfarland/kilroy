var content = ['Home', 'About', 'Products', 'Contact'];


var Tabs = Kilroy({

    view: function () {
        
        var active = this.active || 0;
        
        return ['div',
                    ['.tabs', 
                         content.map(function (c, i) {
                             return ['a', { href: '#' + i, 'class': i === active && 'active' }, c]; })],
                    ['.content', 'Selected: ' + content[active]]];
    },
    
    events: {
        click: {
            a: function (a) {
                this.active = parseInt(a.el.getAttribute('href').slice(1));
                this.d();
            }
        }
    }
});


document.body.appendChild(Tabs().node);