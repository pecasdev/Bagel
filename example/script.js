var SECRET_VAR = 420;

var gameCode = `
importScripts('http://127.0.0.1:5500/bagel.js');
var bagel = sandboxInit(800, 600);

function spawn(val) {
    for (var i=0; i!=val; i++) {
        bagel.createObject(
            function() {
                this.x = Math.floor(Math.random() * 800) + 50;//20;//randInt(50, 350);
                this.y = Math.floor(Math.random() * 600) + 50;//20;//randInt(50, 350);
                this.hspeed = Math.floor(Math.random() * 6) + 2;
                this.vspeed = Math.floor(Math.random() * 6) + 2;
                this.col = [Math.floor(Math.random() * 255) + 0,
                    Math.floor(Math.random() * 255) + 0,
                    Math.floor(Math.random() * 255) + 0, 255];
            },
            function() {
                
                if (this.x >= 797 || this.x <= 2) {
                    this.hspeed *= -1;
                }
                if (this.y >= 597 || this.y <= 2) {
                    this.vspeed *= -1;
                }

                this.x += this.hspeed;
                this.y += this.vspeed;
            },
            function() {
                this.bagel.drawSetCol(this.col)
                this.bagel.drawRect(this.x-3, this.y-3, this.x+3, this.y+3);
                //this.bagel.drawRect(this.x-5, this.y-5, this.x+5, this.y+5);
            }
        );
    }
}

bagel.tickStart();

spawn(5000);
`

gameCode = `
importScripts('http://127.0.0.1:5500/bagel.js');
var bagel = sandboxInit(800, 600);

class Square {
    create() {
        this.x = 50;
        this.y = 50;
    }
    step() {
        this.x -= (this.bagel.keyboardCheck("KeyA") - this.bagel.keyboardCheck("KeyD")) * 5;
        this.y -= (this.bagel.keyboardCheck("KeyW") - this.bagel.keyboardCheck("KeyS")) * 5;
    }
    draw() {
        this.bagel.drawSetCol([255, 255, 255, 255]) // RGBA
        this.bagel.drawRect(this.x-20, this.y-20, this.x+20, this.y+20);
        //console.log(this.x, this.y);
    }

    constructor() {
        bagel.createObject(this.create, this.step, this.draw);
    }
}

var square = new Square();
bagel.tickStart();
`

var otherCode = `
importScripts('http://127.0.0.1:5500/bagel.js');
var bagel = sandboxInit(800, 600);

class Square {
    create() {
        this.x = 50;
        this.y = 50;
    }
    step() {
        this.x -= (this.bagel.keyboardCheck("KeyA") - this.bagel.keyboardCheck("KeyD")) * 5;
        this.y -= (this.bagel.keyboardCheck("KeyW") - this.bagel.keyboardCheck("KeyS")) * 5;
    }
    draw() {
        this.bagel.drawSetCol([150, 150, 150, 255]) // RGBA
        this.bagel.drawRect(this.x-20, this.y-20, this.x+20, this.y+20);
        //console.log(this.x, this.y);
    }

    constructor() {
        bagel.createObject(this.create, this.step, this.draw);
    }
}

var square = new Square();
bagel.tickStart();
`
worldInit("drawCanvas", gameCode);
worldInit("otherCanvas", otherCode);