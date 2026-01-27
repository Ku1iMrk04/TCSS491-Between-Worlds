
import Actor from "./actor.js";

class Player extends Actor {
    constructor(game, x, y) {
        super(game, x, y);
        this.input = null;
        this.name = "Player";
    }

    update() {
        // Example input handling (left/right)
        const dt = this.game.clockTick;
        if (this.game.keys && this.game.keys["ArrowLeft"]) this.x -= this.speed * dt;
        if (this.game.keys && this.game.keys["ArrowRight"]) this.x += this.speed * dt;
        super.update();
    }

    draw(ctx, game) {
        ctx.save();
        ctx.fillStyle = "#3498db";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = "#fff";
        ctx.fillText(this.name, this.x + 2, this.y + 16);
        ctx.restore();
    }
}

export default Player;
