import Scene from "./scene.js";
import Player from "../actors/player.js";
import Enemy from "../actors/enemy.js";
import DeathScene from "./deathscene.js";

class GameScene extends Scene {
    constructor(game) {
        super(game);
        this.isGameplay = true;

        this.player = null;
    }

    enter() {
        // reset entities for a clean run
        this.game.entities = [];

        // spawn player + enemies
        this.player = new Player(this.game, 100, 500);
        this.game.addEntity(this.player);

        const enemy1 = new Enemy(this.game, 300, 500);
        const enemy2 = new Enemy(this.game, 500, 400);
        const enemy3 = new Enemy(this.game, 700, 600);

        this.game.addEntity(enemy1);
        this.game.addEntity(enemy2);
        this.game.addEntity(enemy3);
    }

    update() {
        // If player is removed (dies), go to death scene
        if (this.player && this.player.removeFromWorld) {
            this.game.sceneManager.changeScene(new DeathScene(this.game));
        }
    }

    draw(ctx) {
        // TODO, currently draws HUD only, game engine calls draw for entities and HUD
        this.drawLevelLabel(ctx);
        this.drawControlsHub(ctx);
        this.drawPlayerHealthBar(ctx);
    }

    drawLevelLabel(ctx) {
        const text = "Level 1";

        ctx.save();
        ctx.fillStyle = "black";
        ctx.font = "22px Orbitron, Arial, sans-serif";
        ctx.textBaseline = "top";

        const textWidth = ctx.measureText(text).width;
        const x = (ctx.canvas.width - textWidth) / 2;
        const y = 12;

        ctx.fillText(text, x, y);
        ctx.restore();
    }

    drawControlsHub(ctx) {
        const boxW = 260;
        const boxH = 72;
        const x = ctx.canvas.width - boxW - 16;
        const y = 16;
        const pad = 10;

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
        ctx.font = "14px Arial";
        ctx.textBaseline = "top";
        ctx.fillText("Controls:", x + pad, y + pad);
        ctx.fillText("Move: WASD / Arrow Keys", x + pad, y + pad + 20);
        ctx.fillText("Attack: Space", x + pad, y + pad + 40);

        ctx.restore();
    }

    drawPlayerHealthBar(ctx) {
        if (!this.player) return;

        const maxHp = this.player.maxHealth ?? 50;
        const hp = Math.max(0, Math.min(this.player.health ?? maxHp, maxHp));

        const x = 16;
        const y = 44;
        const w = 220;
        const h = 18;

        // 50 green, 40 lime, 30 yellow, 20 orange, 10 red
        let color = "green";
        if (hp <= 10) color = "red";
        else if (hp <= 20) color = "orange";
        else if (hp <= 30) color = "yellow";
        else if (hp <= 40) color = "lime";

        const ratio = maxHp > 0 ? hp / maxHp : 0;
        const fillW = Math.floor(w * ratio);

        ctx.save();

        // label
        ctx.fillStyle = "#000";
        ctx.font = "14px Arial";
        ctx.textBaseline = "bottom";
        ctx.fillText(`HP: ${hp}/${maxHp}`, x, y - 4);

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