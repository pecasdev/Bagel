var bagel = new Bagel("drawCanvas");

function spawn(val) {
    for (var i=0; i!=val; i++) {
        bagel.createObject(
            function() {
                this.x = Math.floor(Math.random() * 350) + 50;//20;//randInt(50, 350);
                this.y = Math.floor(Math.random() * 350) + 50;//20;//randInt(50, 350);
                this.hspeed = Math.floor(Math.random() * 6) + 2;
                this.vspeed = Math.floor(Math.random() * 6) + 2;
                this.col = [Math.floor(Math.random() * 255) + 0,
                    Math.floor(Math.random() * 255) + 0,
                    Math.floor(Math.random() * 255) + 0, 255];
            },
            function() {
                
                if (this.x >= 397 || this.x <= 2) {
                    this.hspeed *= -1;
                }
                if (this.y >= 397 || this.y <= 2) {
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