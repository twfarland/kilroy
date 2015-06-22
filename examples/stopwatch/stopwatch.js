var Stopwatch = Kilroy({
    
    init: function () {
        this.elapsed = 0;
    },

    start: function () {
        var k = this;
        k.elapsed = 0;
        k.interval = setInterval(function () {
            k.elapsed++;
            k.d();
        }, 1000);
    },

    stop: function () {
        clearInterval(this.interval);
        delete this.interval;
    },
    
    view: function () {
        var k = this;
        return ['.stopwatch', 
                ['h3', 'Stopwatch'],
                ['p', 'Seconds elapsed: ' + k.elapsed],
                ['button', (k.interval) ? 'stop' : 'start']];
    },
    
    events: {
        click: {
            button: function () {
                (this.interval) ? this.stop() : this.start();
                this.d();
            }
        }
    }
});


document.body.appendChild(Stopwatch().node);