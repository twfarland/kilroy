// After facebook.github.io/react/blog/2013/11/05/thinking-in-react.html


var ProductList = Kilroy({

    init: function (products) {
        
        this.filter      = '';
        this.inStockOnly = false;
        this.products    = products || [];
    },

    view: function () {

        var categories = this.filtered();

        return ['#productList',
                
            ['form',
                ['input .filter', { type: 'text', placeholder: 'Search...' }],
                ['fieldset', ['input .stocked', { type: 'checkbox' }], 'Only show products in stock']],

            ['.header .r', 
                ['.c', 'Name'], ['.c', 'Price']],

            Object.keys(categories).map(function (cat) {
                return ['.category', 
                    ['h4', cat],
                    ['.t',
                        categories[cat].map(function (p) {
                            return ['.r', { _key: p.name, 'class': !p.stocked && 'outOfStock' }, 
                                ['.c', p.name],
                                ['.c', p.price]]; })]]; })];
    },

    events: {
        keyup: {
            '.filter': function (a) {
                this.filter = a.el.value || '';
                this.d();
            }
        },
        change: {
            '.stocked': function (a) {
                this.inStockOnly = a.el.checked;
                this.d();
            }
        }
    },
    
    showProduct: function (p) {
        return (p.name.toLowerCase().indexOf(this.filter) > -1) && 
               ((this.inStockOnly) ? p.stocked : true);
    },
    
    filtered: function () {
        
        var categories = {}, k = this;
        
        k.products.forEach(function (p) {
            if (k.showProduct(p)) {
                var cat = p.category;
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(p);
            }
        });
        
        return categories;
    }
});

var productList = ProductList([
    { category: 'Sporting Goods', price: '$49.99',  stocked: true,  name: 'Football' },
    { category: 'Sporting Goods', price: '$9.99',   stocked: true,  name: 'Baseball' },
    { category: 'Sporting Goods', price: '$29.99',  stocked: false, name: 'Basketball' },
    { category: 'Electronics',    price: '$99.99',  stocked: true,  name: 'iPod Touch' },
    { category: 'Electronics',    price: '$399.99', stocked: false, name: 'iPhone 5' },
    { category: 'Electronics',    price: '$199.99', stocked: true,  name: 'Nexus 7' }
]);

document.body.appendChild(productList.node);

