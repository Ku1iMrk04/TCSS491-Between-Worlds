import Scene from "./scene.js";
import GameScene from "./gamescene.js";

class MenuScene extends Scene {
    constructor(game, menuBgImage) {
        super(game);
        this.menuBgImage = menuBgImage;

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
            this.game.sceneManager.changeScene(new GameScene(this.game));
        } else {
            this.showManual = !this.showManual;
        }
    }

    draw(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

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

        // Title
        ctx.fillStyle = "white";
        ctx.font = "48px sans-serif";
        ctx.fillText("BETWEEN WORLDS", 60, 100);

        // Menu options
        ctx.font = "26px sans-serif";
        const startX = 80;
        const startY = 190;
        const lineH = 44;

        this.buttonRects = [];

        for (let i = 0; i < this.options.length; i++) {
            const y = startY + i * lineH;

            ctx.fillStyle = (i === this.selectedIndex) ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.65)";
            ctx.fillText(this.options[i], startX, y);

            if (i === this.selectedIndex) {
                ctx.fillRect(startX - 18, y - 18, 10, 10);
            }

            this.buttonRects.push({ x: startX - 10, y: y - 30, w: 240, h: 40 });
        }

        // Manual placeholder overlay
        if (this.showManual) {
            ctx.fillStyle = "rgba(0,0,0,0.65)";
            ctx.fillRect(60, 260, 560, 180);

            ctx.fillStyle = "white";
            ctx.font = "18px sans-serif";
            ctx.fillText("Manual (placeholder)", 80, 295);
            ctx.fillText("- Use Arrow Keys + Enter in Menu", 80, 325);
            ctx.fillText("- Gameplay controls: your current player controls", 80, 355);
            ctx.fillText("- Dream World / map features coming soon", 80, 385);
        }

        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.font = "16px sans-serif";
        ctx.fillText("Use ↑ ↓ and Enter", 80, h - 40);
    }
}

export default MenuScene;