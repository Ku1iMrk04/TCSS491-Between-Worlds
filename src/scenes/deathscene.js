import Scene from "./scene.js";
import GameScene from "./gamescene.js";
import MenuScene from "./menuscene.js";

class DeathScene extends Scene {
    constructor(game, levelBgImage) {
        super(game);

        this.levelBgImage = levelBgImage;
        this.options = ["Retry", "Main Menu"];
        this.selectedIndex = 0;

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

    activateSelection() {
        if (this.selectedIndex === 0) {
            this.game.sceneManager.changeScene(new GameScene(this.game, this.levelBgImage));
        } else {
            const levelBg = this.game.assetManager.getAsset("assets/level_background.png");
            this.game.sceneManager.changeScene(new MenuScene(this.game, this.game.menuBgImage, levelBg));
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

    draw(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        const centerX = w / 2;

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "red";
        ctx.font = '56px "Orbitron", sans-serif';
        ctx.fillText("YOU DIED", centerX, 130);
        ctx.restore();

        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = '20px "Oxanium", sans-serif';

        const startY = h * 0.38;
        const lineH = 56;

        this.buttonRects = [];

        for (let i = 0; i < this.options.length; i++) {
            const y = startY + i * lineH;
            const isSelected = (i === this.selectedIndex);

            ctx.fillStyle = isSelected ? "white" : "rgba(255,255,255,0.65)";
            ctx.fillText(this.options[i], centerX, y);

            if (isSelected) {
                ctx.fillStyle = "white";
                ctx.fillRect(centerX - 140, y - 6, 10, 10);
            }

            const textW = ctx.measureText(this.options[i]).width;
            const padX = 32;
            const padY = 18;

            this.buttonRects.push({
                x: centerX - textW / 2 - padX,
                y: y - 34 / 2 - padY,
                w: textW + padX * 2,
                h: 34 + padY * 2
            });
        }
        ctx.restore();

        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.font = '16px "Oxanium", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("Use ↑ ↓ and Enter, OR Click", centerX, h - 40);
        ctx.restore();
        
    }
}

export default DeathScene;