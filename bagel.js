BAGEL_KEYMAP = {};
BAGEL_MOUSEMAP = {};
_BAGEL_INPUT_STREAM = []; // events that bagel has not registered yet

function queueTaggedEvent(tag, worker) {
    return (event) => worker.postMessage(
        {
            "tag": "inputEvent",
            "data": {
                button: event.button,
                type: event.type,
                code: event.code,
                bagelEventTag: tag,
                relativeX: event.pageX - event.target.getBoundingClientRect().left,
                relativeY: event.pageY - event.target.getBoundingClientRect().top
            }
        }
    );
}

function mouseEventHandler(event) {
    if (event.type != "mousemove") {
        if (!(event.button in BAGEL_MOUSEMAP)) {
            BAGEL_MOUSEMAP[event.button] = {"sum": 0, "downTrigger": false, "upTrigger": false};
        } 

        BAGEL_MOUSEMAP[event.button].sum += (event.type == "mousedown" ? 1 : -1);    

        if (event.type == "keydown") {
            BAGEL_MOUSEMAP[event.button].downTrigger = true;
        }
    
        if (event.type == "keyup") {
            BAGEL_MOUSEMAP[event.button].upTrigger = true;
        }
    }
    
    BAGEL_MOUSEMAP["x"] = event.relativeX;
    BAGEL_MOUSEMAP["y"] = event.relativeY;
}

function keyboardEventHandler(event) {
    if (event.repeat) {
        return;
    }

    if (!(event.code in BAGEL_KEYMAP)) {
        BAGEL_KEYMAP[event.code] = {"sum": 0, "downTrigger": false, "upTrigger": false};
    } 

    BAGEL_KEYMAP[event.code].sum += (event.type == "keydown" ? 1 : -1);

    if (event.type == "keydown") {
        BAGEL_KEYMAP[event.code].downTrigger = true;
    }

    if (event.type == "keyup") {
        BAGEL_KEYMAP[event.code].upTrigger = true;
    }
}

class BagelObject {
    constructor(bagel, init, step, draw) {
        this.bagel = bagel;
        this.init = init;
        this.step = step;
        this.draw = draw;
    }
}

function setupBagelHandlers(canvasid, worker) {
    var canvas = document.getElementById(canvasid);

    // setup keyboard handlers
    canvas.addEventListener("keydown", queueTaggedEvent("keyboard", worker));
    canvas.addEventListener("keyup", queueTaggedEvent("keyboard", worker));

    // setup mouse handlers
    canvas.addEventListener("mousedown", queueTaggedEvent("mouse", worker));
    canvas.addEventListener("mouseup", queueTaggedEvent("mouse", worker));
    canvas.addEventListener("mousemove", queueTaggedEvent("mouse", worker));
    canvas.addEventListener("mouseleave", queueTaggedEvent("mouse", worker));

    // setup reset handler
    canvas.addEventListener("blur", () => {interSpaceSend(worker, "resetInputMap"); console.log("yot")});

    // setup focus handler
    canvas.addEventListener("mousemove", (e) => e.target.focus());
}

function drawUpdateHandler(canvasid) {
    var canvas = document.getElementById(canvasid);
    var ctx = canvas.getContext('2d');
    var ctximagedata = ctx.getImageData(0, 0, canvas.width, canvas.height);

    return (imagedata) => {
        ctximagedata.data.set(imagedata);
        ctx.putImageData(ctximagedata, 0, 0);
    }
}

function interSpaceSend(worker, tag, data) {    // send message from space to other space (sandbox -> world || world -> sandbox)
    worker.postMessage(
        message = {
            "tag": tag,
            "data": data
        }
    );
}

/*function safe_execute(code) {
    var blob = new Blob([code], {'type': 'application/javascript'});
    var worker = new Worker(URL.createObjectURL(blob));
    var render = initBagelGlobal("drawCanvas", worker);
    worker.onmessage = (e) => worldReceiveFromSandbox(e.data);
}*/

class Bagel {
    constructor(width, height, drawUpdateHandler) {
        // basic attributes
        this.canvasWidth = width;
        this.canvasHeight = height;
        this.canvasData = new ImageData(width, height);

        // drawing placeholders
        this.drawCol = [0, 0, 0, 255];  // RGBA

        // communication outside of sandbox
        this.drawUpdateHandler = drawUpdateHandler;

        // object data & ticker
        this.bagelObjects = [];
        this.tickRate = 100;
        this.tickStarted = false;
        
        // DEBUG FPS STUFF
        this.FPSLastTime = Date.now();
        this.FPSCounter = 0;
        // TODO - set draw target function so you can pass multiple canvas ids to
        //        bagel and have it switch between draw targets
    }

    randint(min, max) {
        return Math.random() * (max - min) + min;
    }

    drawSetCol(col) {
        this.drawCol = col;
    }

    drawPixel(x, y) {
        x = Math.floor(x)
        y = Math.floor(y);
        // return if outside bounds to draw
        if (x >= this.canvasWidth || x < 0 || y >= this.canvasHeight || y < 0) {
            return;
        }

        var index = (x + y * this.canvasWidth) * 4;

        this.canvasData.data[index + 0] =  this.drawCol[0];
        this.canvasData.data[index + 1] =  this.drawCol[1];
        this.canvasData.data[index + 2] =  this.drawCol[2];
        this.canvasData.data[index + 3] =  this.drawCol[3];
    }

    clear() {
        this.canvasData = new ImageData(this.canvasWidth, this.canvasHeight);
    }

    update() {
        //console.log("source", this.canvasData.data);
        this.drawUpdateHandler(this.canvasData.data);
    }

    drawLine(x1, y1, x2, y2) {
        x1 = Math.floor(x1);
        y1 = Math.floor(y1);
        x2 = Math.floor(x2);
        y2 = Math.floor(y2);

        // http://rosettacode.org/wiki/Bitmap/Bresenham%27s_line_algorithm#JavaScript
        var dx = Math.abs(x2 - x1), sx = x1 < x2 ? 1 : -1;
        var dy = Math.abs(y2 - y1), sy = y1 < y2 ? 1 : -1; 
        var err = (dx>dy ? dx : -dy)/2;
        
        while (true) {
            this.drawPixel(x1, y1);
            if (x1 === x2 && y1 === y2) break;
            var e2 = err;
            if (e2 > -dx) { err -= dy; x1 += sx; }
            if (e2 < dy) { err += dx; y1 += sy; }
        }
    }

    drawTriangle(x1, y1, x2, y2, x3, y3) {
        this.drawLine(x1, y1, x2, y2);
        this.drawLine(x2, y2, x3, y3);
        this.drawLine(x3, y3, x1, y1);
    }

    fillTriangle(x1, y1, x2, y2, x3, y3) {
        // adapted from http://www.sunshine2k.de/coding/java/TriangleRasterization/TriangleRasterization.html
        x1 = Math.floor(x1);
        y1 = Math.floor(y1);
        x2 = Math.floor(x2);
        y2 = Math.floor(y2);
        x3 = Math.floor(x3);
        y3 = Math.floor(y3);

        // sort in increasing value
        [[x1, y1], [x2, y2], [x3, y3]] = [[x1, y1], [x2, y2], [x3, y3]].sort((a,b) => (a[1] < b[1]) ? -1 : ((a[1] > b[1]) ? 1 : 0));

        // call function twice if not a flat top/bottom triangle
        if (y2 != y3 && y1 != y2) {
            var x4 = x1 + (((y2-y1) / (y3-y1)) * (x3-x1));
            this.fillTriangle(x1, y1, x2, y2, x4, y2);
            this.fillTriangle(x2, y2, x4, y2, x3, y3);
            this.drawLine(x2, y2, x4, y2);
            this.drawTriangle(x1, y1, x2, y2, x3, y3);
            return;
        }

        if (y2 == y3) {
            this.drawTriangle(x1, y1, x2, y2, x3, y3);
        }
        
        if (y1 == y2) {
            [x1, y1, x2, y2, x3, y3] = [x3, y3, x1, y1, x2, y2];
            this.drawTriangle(x1, y1, x2, y2, x3, y3);
        }

        // first bresenham line
        var dx1 = Math.abs(x2 - x1), sx1 = x1 < x2 ? 1 : -1;
        var dy1 = Math.abs(y2 - y1), sy1 = y1 < y2 ? 1 : -1;
        var err1 = (dx1>dy1 ? dx1 : -dy1)/2;

        // second bresenham line
        var dx2 = Math.abs(x3 - x1), sx2 = x1 < x3 ? 1 : -1;
        var dy2 = Math.abs(y3 - y1), sy2 = y1 < y3 ? 1 : -1;
        var err2 = (dx2>dy2 ? dx2 : -dy2)/2;

        var lineAx = x1, lineBx = x1, lineAy = y1, lineBy = y1;
        var scan1 = false, scan2 = false;
        var safety = 0;
        
        while (safety < 500) {
            this.drawPixel(lineAx, lineAy);
            this.drawPixel(lineBx, lineBy);

            if ((lineAx == x2 && lineAy == y2) || (lineBx == x3 && lineBy == y3)) {
                break;
            }
            
            if (!scan1) {
                var next1 = err1;
                if (next1 > -dx1) { err1 -= dy1; lineAx += sx1; }
                if (next1 < dy1) { err1 += dx1; lineAy += sy1; scan1=true; }
            }

            if (!scan2) {
                var next2 = err2;
                if (next2 > -dx2) { err2 -= dy2; lineBx += sx2; }
                if (next2 < dy2) { err2 += dx2; lineBy += sy2; scan2=true; }
            }
        
            // fill the space between
            if (scan1 && scan2) {
                this.drawLine(lineAx, lineAy, lineBx, lineBy);
                scan1 = false;
                scan2 = false;
            }

            safety += 1;
        }
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
        while(_BAGEL_INPUT_STREAM.length > 0) {
            var event = _BAGEL_INPUT_STREAM.pop(0);
            if (event.bagelEventTag == "mouse") {
                mouseEventHandler(event);
            }

            if (event.bagelEventTag == "keyboard") {
                keyboardEventHandler(event);
            }
        }

        //console.log(this.bagelObjects);
        for (var obj of this.bagelObjects) {
            obj.step();
        }

        this.clear();
        for (var obj of this.bagelObjects) {
            obj.draw();
        }
        this.update();

        // reset mappings
        this.resetBagelMappings();

        if (this.FPSLastTime < Date.now() - 1000) {
            //console.log(`FPS: ${this.FPSCounter}`);
            this.FPSLastTime = Date.now();
            this.FPSCounter = 0;
        }
        else
        {
            this.FPSCounter += 1;
        }
    };

    resetBagelMappings() {
        for (var key of Object.keys(BAGEL_KEYMAP)) {
            // prevent keylocking by inputting double keydown (and no keyup)
            if (BAGEL_KEYMAP[key].upTrigger) {
                BAGEL_KEYMAP[key].sum = 0;
            }

            BAGEL_KEYMAP[key].downTrigger = false;
            BAGEL_KEYMAP[key].upTrigger = false;
        }
    }

    tickStart() {
        if (!this.tickStarted) {
            this.ticker = setInterval(this.tick, 1000/this.tickRate);
        }
    }

    tickStop() { 
        clearInterval(this.ticker);
    }

    keyboardCheck(key) {
        return (key in BAGEL_KEYMAP ? BAGEL_KEYMAP[key].sum > 0 : false);
    }

    keyboardCheckCount(key) {
        return (key in BAGEL_KEYMAP ? BAGEL_KEYMAP[key].sum : 0);
    }

    keyboardCheckPressed(key) {
        return (key in BAGEL_KEYMAP ? BAGEL_KEYMAP[key].downTrigger : false);
    }

    keyboardCheckReleased(key) {
        return (key in BAGEL_KEYMAP ? BAGEL_KEYMAP[key].upTrigger : false);
    }
}


function sandboxReceiveFromWorld(package) {
    if (package.tag == "inputEvent") {
        _BAGEL_INPUT_STREAM.push(package.data);
    }
    
    if (package.tag == "resetInputMap") {
        BAGEL_KEYMAP = {};
        BAGEL_MOUSEMAP = {};
    }
}

function sandboxInit(width, height) {
    self.onmessage = (e) => sandboxReceiveFromWorld(e.data);
    return new Bagel(width, height, (imagedata) => interSpaceSend(self, "canvasDump", imagedata));
}

function worldReceiveFromSandboxHandler(renderFunc) {
    return (package) => {
        if (package.tag == "canvasDump") {
            renderFunc(package.data);
        }
    }
}

function worldInit(canvasid, appcode) {
    // safely execute appcode 
    var blob = new Blob([appcode], {'type': 'application/javascript'}); 
    var worker = new Worker(URL.createObjectURL(blob));

    // setup input handlers (kb + mouse / world -> sandbox)
    setupBagelHandlers(canvasid, worker);

    // setup draw handler (sandbox -> world)
    var render = drawUpdateHandler(canvasid);

    // create a handler (while passing in the render function to use)
    var worldReceiveFromSandbox = worldReceiveFromSandboxHandler(render);

    // set onmessage to the above handler
    worker.onmessage = (e) => worldReceiveFromSandbox(e.data);
}