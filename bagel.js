class BagelObject {
    constructor(bagel, init, step, draw) {
        this.bagel = bagel;
        this.init = init;
        this.step = step;
        this.draw = draw;
    }
}

class Bagel {
    constructor(canvasid) {
        // basic attributes
        this.canvas = document.getElementById(canvasid);
        this.ctx = this.canvas.getContext('2d');
        this.canvasData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        // drawing placeholders
        this.drawCol = [0, 0, 0, 255];  // RGBA

        // object data & ticker
        this.bagelObjects = [];
        this.tickRate = 60;
        this.tickStarted = false;
        
        // DEBUG FPS STUFF
        this.FPSLastTime = Date.now();
        this.FPSCounter = 0;
        // TODO - set draw target function so you can pass multiple canvas ids to
        //        bagel and have it switch between draw targets
    }

    drawSetCol(col) {
        this.drawCol = col;
    }

    drawPixel(x, y) {
        // return if outside bounds to draw
        if (x >= this.canvas.width || x < 0 || y >= this.canvas.height || y < 0) {
            return;
        }

        var index = (x + y * this.canvas.width) * 4;

        this.canvasData.data[index + 0] =  this.drawCol[0];
        this.canvasData.data[index + 1] =  this.drawCol[1];
        this.canvasData.data[index + 2] =  this.drawCol[2];
        this.canvasData.data[index + 3] =  this.drawCol[3];
    }

    clear() {
        this.canvasData = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    }

    update() {
        this.ctx.putImageData(this.canvasData, 0, 0);
    }

    drawRect(x1, y1, x2, y2) {
        for (var y=y1; y!=y2; y++) {
            for (var x=x1; x!=x2; x++) {
                this.drawPixel(x, y);
            }
        }
    }

    createObject(init, step, draw) {
        var obj = new BagelObject(this, init, step, draw);
        obj.init();

        this.bagelObjects.push(obj);
    }

    tick = () => {
        for (var obj of this.bagelObjects) {
            obj.step();
        }

        this.clear();
        for (var obj of this.bagelObjects) {
            obj.draw();
        }
        this.update();

        if (this.FPSLastTime < Date.now() - 1000) {
            console.log(`FPS: ${this.FPSCounter}`);
            this.FPSLastTime = Date.now();
            this.FPSCounter = 0;
        }
        else
        {
            this.FPSCounter += 1;
        }
    };

    tickStart() {
        this.ticker = setInterval(this.tick, 1000/this.tickRate);
    }

    tickStop() { 
        clearInterval(this.ticker);
    }
}

function randInt(a, b) {
    Math.floor(Math.random() * b) + a; 
}