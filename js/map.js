class Map {
    constructor(canvas, x, y) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");

        if (x && y) {
            this.position = {x: x, y: y};

        } else {
            this.position = {};
        }

        this.background = document.querySelector("#map-img");
    }

    onClick(x, y) {
        x = (x) / this.canvas.width;
        y = (y) / this.canvas.height;

        this.position = {x: x, y: y};
        this.draw();
    }

    draw() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.ctx.drawImage(this.background, 0, 0, this.canvas.width, this.canvas.height);

        if (this.position) {
            this.ctx.beginPath();
            this.ctx.arc(this.position.x * this.canvas.width, this.position.y * this.canvas.height, 
                this.canvas.width / 30, 0, 2*Math.PI, false);
            this.ctx.fillStyle = "#fff";
            this.ctx.fill(); 
        }
    }

    clear() {
        this.position = {};
        this.draw();
    }
}