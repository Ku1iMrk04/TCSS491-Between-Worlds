
import Actor from "./actor.js";
import Idle from "../states/idle.js";
import Attack from "../states/attack.js";

class Player extends Actor {
    constructor(game, x, y) {
        super(game, x, y);
        this.input = null;
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
        const keys = this.game.keys;

        // Attack with spacebar (only if not already attacking)
        if (keys && keys[" "] && this.currentState !== this.states["attack"]) {
            this.changeState("attack");
        }

        // Update facing direction (always, even during attack)
        if (keys && (keys["a"] || keys["ArrowLeft"])) this.facing = "left";
        if (keys && (keys["d"] || keys["ArrowRight"])) this.facing = "right";

        // WASD and Arrow key movement (disabled during attack)
        if (this.currentState !== this.states["attack"]) {
            if (keys && (keys["a"] || keys["ArrowLeft"])) this.x -= this.speed * dt;
            if (keys && (keys["d"] || keys["ArrowRight"])) this.x += this.speed * dt;
            if (keys && (keys["w"] || keys["ArrowUp"])) this.y -= this.speed * dt;
            if (keys && (keys["s"] || keys["ArrowDown"])) this.y += this.speed * dt;
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
