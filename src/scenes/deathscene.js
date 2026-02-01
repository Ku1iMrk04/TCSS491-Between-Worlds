import Scene from "./scene.js";
import GameScene from "./gamescene.js";
import MenuScene from "./menuscene.js";

class DeathScene extends Scene {
    constructor(game) {
        super(game);

        this.options = ["Retry", "Main Menu"];
        this.selectedIndex = 0;
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
                if (this.selectedIndex === 0) {
                    this.game.sceneManager.changeScene(new GameScene(this.game));
                } else {
                    this.game.sceneManager.changeScene(new MenuScene(this.game, this.game.menuBgImage));
                }
                break;
        }
    }

    draw(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = "red";
        ctx.font = "56px sans-serif";
        ctx.fillText("YOU DIED", 60, 130);

        ctx.font = "26px sans-serif";
        for (let i = 0; i < this.options.length; i++) {
            const y = 220 + i * 44;
            ctx.fillStyle = (i === this.selectedIndex) ? "white" : "rgba(255,255,255,0.65)";
            ctx.fillText(this.options[i], 80, y);
        }

        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.font = "16px sans-serif";
        ctx.fillText("Use ↑ ↓ and Enter", 80, h - 40);
    }
}

export default DeathScene;