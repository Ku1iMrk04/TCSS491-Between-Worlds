import Scene from "./scene.js";
import GameScene from "./gamescene.js";

class MenuScene extends Scene {
    constructor(game, menuBgImage, levelBgImage) {
        super(game);
        this.menuBgImage = menuBgImage;
        this.levelBgImage = levelBgImage;
        this.options = ["Start Game", "Manual"];
        this.selectedIndex = 0;

        this.showManual = false;
        this.buttonRects = [];
    }

    onKeyDown(event) {
        
        switch (event.code) {
            case "ArrowUp":
                this.selectedIndex = (this.selectedIndex + this.options.length - 1) % this.options.length;
                break;
            case "ArrowDown":
                this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
                break;
            case "Enter":
                this.activateSelection();
                break;
        }
    }

    onClick(x, y) {
        for (let i = 0; i < this.buttonRects.length; i++) {
            const r = this.buttonRects[i];
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                this.selectedIndex = i;
                this.activateSelection();
                return;
            }
        }
    }

    activateSelection() {
        if (this.selectedIndex === 0) {

            this.game.sceneManager.changeScene(new GameScene(this.game, this.levelBgImage));
        } else {
            this.showManual = !this.showManual;
        }
    }

    draw(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        const centerX = w / 2;

        // Background image
        if (this.menuBgImage) {
            ctx.drawImage(this.menuBgImage, 0, 0, w, h);
        } else {
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, w, h);
        }

        // Dark overlay for readability
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";

        // Title
        ctx.fillStyle = "white";
        ctx.font = '48px "Orbitron", sans-serif';
        ctx.fillText("BETWEEN WORLDS", centerX, 100);

        // Menu options
        ctx.font = '26px "Oxanium", sans-serif';
        const startY = 190;
        const lineH = 44;

        this.buttonRects = [];

        for (let i = 0; i < this.options.length; i++) {
            const y = startY + i * lineH;

            ctx.fillStyle = (i === this.selectedIndex) ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.65)";
            ctx.fillText(this.options[i], centerX, y);

            if (i === this.selectedIndex) {
                ctx.fillRect(centerX - 140, y - 18, 10, 10);
            }

            this.buttonRects.push({ x: centerX - 120, y: y - 30, w: 240, h: 40 });
        }

        // Manual display
        
        if (this.showManual) {
            // Box size
            const boxW = 700;              
            const boxH = 220;
            const boxX = (w - boxW) / 2;   
            const boxY = (h - boxH) / 2;   

            // Draw box
            ctx.fillStyle = "rgba(0,0,0,0.65)";
            ctx.fillRect(boxX, boxY, boxW, boxH);

            // Text settings
            ctx.fillStyle = "white";
            ctx.font = '18px "Oxanium", sans-serif';

            // Left align *inside* the box with padding
            const pad = 28;
            const textX = boxX + pad;
            let y = boxY + 40;
            const lineH = 34;

            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";

            ctx.fillText("Manual (placeholder)", textX, y); y += lineH;
            ctx.fillText("-Player: 50 hp, Hit enemy twice to kill | Enemy: 40hp, 5 hits to defeat Player ", textX, y); y += lineH;

            ctx.fillText("- Gameplay controls: Use arrow keys to move, space bar to attack,", textX, y); y += lineH;
            ctx.fillText("  more features coming soon.", textX, y); y += lineH;

            ctx.fillText("- Dream World / map features coming soon", textX, y); y += lineH

            ctx.fillText("- Goal: You must defeat all enemies and survive to escape the dream world!", textX, y);
        }
        // Footer
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.font = '16px "Oxanium", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("Use ↑ ↓ and Enter, OR Click", w / 2, h - 40);
        ctx.restore();  

        ctx.textAlign = "left";
    }
}

export default MenuScene;