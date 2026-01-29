
import Actor from "./actor.js";
import Idle from "../states/idle.js";
import Attack from "../states/attack.js";

class Player extends Actor {
    constructor(game, x, y) {
        super(game, x, y);
        this.name = "Player";
        this.facing = "right";  // Direction player is facing
        this.setCollider({ layer: "player" });

        // Register states
        this.addState("idle", new Idle());
        this.addState("attack", new Attack());
        this.changeState("idle");
    }

    onCollision(other) {
        // Handle collision with other entities
        console.log("Player collided with:", other.name);
    }

    update() {
        const dt = this.game.clockTick;

        // Later this can be changed to jump when jump is implemented
        if (this.game.space && this.currentState !== this.states["attack"]) {
            this.changeState("attack");
        }

        // Update facing direction (always, even during attack)
        if (this.game.left) this.facing = "left";
        if (this.game.right) this.facing = "right";

        // WASD and Arrow key movement (disabled during attack)
        if (this.currentState !== this.states["attack"]) {
            if (this.game.left) this.x -= this.speed * dt;
            if (this.game.right) this.x += this.speed * dt;
            if (this.game.up) this.y -= this.speed * dt;
            if (this.game.down) this.y += this.speed * dt;
        }

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
