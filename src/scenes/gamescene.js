import Scene from "./scene.js";
import Player from "../actors/player.js";
import Enemy from "../actors/enemy.js";
import DeathScene from "./deathscene.js";


class GameScene extends Scene {
    constructor(game, levelBgImage ) {
        super(game);
        this.isGameplay = true;
        this.levelBgImage = levelBgImage;

        this.player = null;
    }

    enter() {
        // reset entities for a clean run
        this.game.entities = [];

        // spawn player + enemies (scaled for 1920x1080 canvas)
        this.player = new Player(this.game, 300, 750);
        this.game.addEntity(this.player);

        const enemy1 = new Enemy(this.game, 900, 750);
        const enemy2 = new Enemy(this.game, 1500, 600);
        const enemy3 = new Enemy(this.game, 1200, 840);

        this.game.addEntity(enemy1);
        this.game.addEntity(enemy2);
        this.game.addEntity(enemy3);
    }

    update() {
        // If player is removed (dies), go to death scene
        if (this.player && this.player.removeFromWorld) {
            this.game.sceneManager.changeScene(new DeathScene(this.game, this.levelBgImage));
        }
    }

    draw(ctx) {
        // Disable anti-aliasing for game scene
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;

        // Draw level background first
        if (this.levelBgImage) {
            ctx.drawImage(this.levelBgImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
        }

        // Then draw HUD on top
        this.drawLevelLabel(ctx);
        this.drawControlsHub(ctx);
        this.drawPlayerHealthBar(ctx);
    }

    drawLevelLabel(ctx) {
        const text = "Level 1";

        ctx.save();
        ctx.fillStyle = "black";
        ctx.font = "66px Orbitron, Arial, sans-serif";
        ctx.textBaseline = "top";

        const textWidth = ctx.measureText(text).width;
        const x = (ctx.canvas.width - textWidth) / 2;
        const y = 36;

        ctx.fillText(text, x, y);
        ctx.restore();
    }

    drawControlsHub(ctx) {
        const boxW = 520;
        const boxH = 144;
        const x = ctx.canvas.width - boxW - 32;
        const y = 32;
        const pad = 20;

        ctx.save();

        // faint gray panel
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = "#e0e0e0";
        ctx.fillRect(x, y, boxW, boxH);

        // border
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#b0b0b0";
        ctx.strokeRect(x, y, boxW, boxH);

        // text
        ctx.fillStyle = "#333";
        ctx.font = "28px Arial";
        ctx.textBaseline = "top";
        ctx.fillText("Controls:", x + pad, y + pad);
        ctx.fillText("Move: WASD / Arrow Keys", x + pad, y + pad + 40);
        ctx.fillText("Attack: Space", x + pad, y + pad + 80);

        ctx.restore();
    }

    drawPlayerHealthBar(ctx) {
        if (!this.player) return;

        const maxHp = this.player.maxHealth ?? 50;
        const hp = Math.max(0, Math.min(this.player.health ?? maxHp, maxHp));

        const x = 48;
        const y = 132;
        const w = 660;
        const h = 54;

        // 50 green, 40 lime, 30 yellow, 20 orange, 10 red
        let color = "green";
        if (hp <= 10) color = "red";
        else if (hp <= 20) color = "orange";
        else if (hp <= 30) color = "yellow";
        else if (hp <= 40) color = "lime";

        const ratio = maxHp > 0 ? hp / maxHp : 0;
        const fillW = Math.floor(w * ratio);

        ctx.save();

        // label with gray background box
        ctx.fillStyle = "#333";
        ctx.font = "42px Arial";
        ctx.textBaseline = "bottom";
        ctx.fillText(`HP: ${hp}/${maxHp}`, x, y - 12);

        // bar background
        ctx.fillStyle = "#444";
        ctx.fillRect(x, y, w, h);

        // single bar shrink
        ctx.fillStyle = color;
        ctx.fillRect(x, y, fillW, h);

        // border
        ctx.strokeStyle = "#111";
        ctx.strokeRect(x, y, w, h);

        ctx.restore();
    }
}

export default GameScene;