
class Map {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
        
        this.background = document.querySelector("#map-img");
        this.mouse = {x: 0.5, y: 0.5};
        this.docs = [];

        this.canvas.addEventListener('mousemove', (e) => this.mouseMoved(this, e));
    }

    mouseMoved(mapObject, event) {
        mapObject.mouse.x = event.offsetX / mapObject.canvas.width;
        mapObject.mouse.y = event.offsetY / mapObject.canvas.height;

        mapObject.draw();
    }

    setDocs(docs) {
        this.docs = docs;
        this.draw();
    }

    draw() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.ctx.drawImage(this.background, 0, 0, this.canvas.width, this.canvas.height);

        for (let doc of this.docs) {
            this.drawPoint(doc.position.x, doc.position.y);
        }

        let selected = this.getSelected();

        if (selected) {
            this.drawSelected(selected)
        }
    }

    drawPoint(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x * this.canvas.width, y * this.canvas.height, 5, 0, 2*Math.PI, false);
        this.ctx.fillStyle = "#aaa";
        this.ctx.fill(); 
    }

    drawSelected(doc) {
        // Draw point
        this.ctx.beginPath();
        this.ctx.arc(doc.position.x * this.canvas.width, doc.position.y * this.canvas.height, 10, 0, 2*Math.PI, false);
        this.ctx.fillStyle = "#fff";
        this.ctx.fill(); 

        this.ctx.font = "1em Inconsolata";
        this.ctx.textAlign = "center";
        let textVerticalOffset;
        let fillRectHeight;

        // Display text below point if it is near the top of the map
        if (doc.position.y < 0.1) {
            this.ctx.textBaseline = "top"
            textVerticalOffset = 12;
            fillRectHeight = 18;

        } else {
            this.ctx.textBaseline = "bottom"
            textVerticalOffset = -12;
            fillRectHeight = -18;
        }

        this.ctx.fillStyle = "#222c";
        let textWidth = this.ctx.measureText(doc.name).width + 10;
        this.ctx.fillRect(doc.position.x * this.canvas.width - textWidth / 2, 
                          doc.position.y * this.canvas.height + textVerticalOffset, textWidth, fillRectHeight);
        
        this.ctx.fillStyle = "#fff";
        this.ctx.fillText(doc.name, doc.position.x * this.canvas.width, doc.position.y * this.canvas.height + textVerticalOffset);
    }

    getSelected() {
        let closestDoc = null;

        // Value here sets min distance for entry to be highlighted
        let closestDist = 20 / this.canvas.width;

        for (let doc of this.docs) {
            let dist = Math.sqrt((doc.position.x - this.mouse.x) * (doc.position.x - this.mouse.x) + 
                                 (doc.position.y - this.mouse.y) * (doc.position.y - this.mouse.y));
            
            if (dist < closestDist) {
                closestDoc = doc;
                closestDist = dist;
            } 
        }

        return closestDoc;
    }
}

class ViewMap extends Map {
    constructor(canvas, clickFunction) {
        super(canvas)

        this.clickFunction = clickFunction;

        document.querySelector("#main-map").addEventListener('click', (e) => this.mouseClicked(this, e));
    }

    mouseClicked(mapObject, event) {
        let x = event.offsetX / mapObject.canvas.width;
        let y = event.offsetY / mapObject.canvas.height;

        let selected = mapObject.getSelected();

        if (selected) {
            mapObject.clickFunction(selected._id);
        }
    }
}

class EditMap extends Map {
    constructor(canvas) {
        super(canvas);
        this.editingPosition = {};

        document.querySelector("#edit-map").addEventListener('click', (e) => this.mouseClicked(this, e));
    }

    mouseClicked(mapObject, event) {
        let x = event.offsetX / mapObject.canvas.width;
        let y = event.offsetY / mapObject.canvas.height;

        mapObject.editingPosition = {x: x, y: y};
        mapObject.draw();
    }

    draw() {
        super.draw();
        this.drawEditing();
    }

    drawEditing() {
        this.ctx.beginPath();
        this.ctx.arc(this.editingPosition.x * this.canvas.width, this.editingPosition.y * this.canvas.height, 10, 0, 2*Math.PI, false);
        this.ctx.fillStyle = "rgb(62, 139, 255)";
        this.ctx.fill(); 
    }
}