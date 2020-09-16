class Bagel {
    constructor(canvasid) {
        // basic attributes
        this.canvas = document.getElementById(canvasid);
        this.ctx = this.canvas.getContext('2d');
        this.canvasData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.blank = this.ctx.createImageData(this.canvas.width, this.canvas.height);

        // drawing placeholders
        this.drawCol = [0, 0, 0, 255];  // RGBA
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
        this.canvasData = this.blank;
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
}