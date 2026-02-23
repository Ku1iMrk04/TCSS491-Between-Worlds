import Scene from "./scene.js";

class LevelCompleteScene extends Scene {
    constructor(game, levelBgImage, onRestart, onMainMenu) {
        super(game);

        this.levelBgImage = levelBgImage;
        this.onRestart = onRestart;
        this.onMainMenu = onMainMenu;
        this.options = ["Restart", "Next Level", "Main Menu"];
        this.selectedIndex = 0;

        this.showConstructionPopup = false;
        this.buttonRects = [];
    }

    enter() {
        // Ensure no lingering gameplay entities remain active in this non-gameplay scene.
        this.game.entities = [];
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
            if (typeof this.onRestart === "function") {
                this.game.sceneManager.changeScene(this.onRestart());
            }
        } else if (this.selectedIndex === 1) {
            this.showConstructionPopup = !this.showConstructionPopup;
        } else if (this.selectedIndex === 2) {
            if (typeof this.onMainMenu === "function") {
                this.game.sceneManager.changeScene(this.onMainMenu());
            }
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

        ctx.fillStyle = "#0a43b8";
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white";
        ctx.font = '48px "Orbitron", sans-serif';
        ctx.fillText("Well done, you beat Level 1", centerX, 130);
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

            ctx.fillStyle = isSelected ? "white" : "rgba(255,255,255,0.75)";
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

        if (this.showConstructionPopup) {
            // Keep popup style consistent with MenuScene manual box.
            const boxW = 700;
            const boxH = 170;
            const boxX = (w - boxW) / 2;
            const popupYOffset = 140;
            const boxY = ((h - boxH) / 2) + popupYOffset;

            ctx.fillStyle = "rgba(0,0,0,0.65)";
            ctx.fillRect(boxX, boxY, boxW, boxH);

            ctx.fillStyle = "white";
            ctx.font = '24px "Oxanium", sans-serif';
            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";

            const pad = 28;
            const textX = boxX + pad;
            const textY = boxY + 60;
            ctx.fillText("This level is currently under construction", textX, textY);
        }

        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = '16px "Oxanium", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("Use ↑ ↓ and Enter, OR Click", centerX, h - 40);
        ctx.restore();
    }
}

export default LevelCompleteScene;
