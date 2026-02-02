
import Actor from "./actor.js";
import Idle from "../states/idle.js";
import Attack from "../states/attack.js";
import Run from "../states/run.js";
import Jump from "../states/jump.js";
import Roll from "../states/roll.js";

import Animator from "../animation/animator.js";
class Player extends Actor {
    constructor(game, x, y) {
        super(game, x, y);
        this.name = "Player";
        this.facing = "right";  // Direction player is facing
        this.scale = 3;
        this.width = 35 * this.scale;
        this.height = 35 * this.scale;
        this.setCollider({ layer: "player" });
        this.animator = new Animator("zero", this.game.assetManager)
        this.animator.setScale(this.scale);
        this.speed = 200;
        this.currentAnimState = "idle";  // Track current animation state
        // Register states
        this.addState("idle", new Idle());
        this.addState("run", new Run());
        this.addState("jump", new Jump());
        this.addState("roll", new Roll());
        this.addState("attack", new Attack());
        this.changeState("idle");
    }

    onCollision(other) {
        // Handle collision with other entities
        console.log("Player collided with:", other.name);
    }

    update() {
        const dt = this.game.clockTick;

        // Temporary ground detection (replace with collision detection later)
        const groundY = 500;
        if (this.y >= groundY) {
            this.y = groundY;
            this.grounded = true;
            this.vy = 0;
        } else {
            this.grounded = false;
        }

        // Jump input (only when grounded and not attacking/rolling)
        if (this.game.space && this.grounded && this.currentState !== this.states["attack"] && this.currentState !== this.states["roll"]) {
            this.changeState("jump");
        }

        // Roll input (left shift - only when grounded and not already rolling/attacking)
        if (this.game.shift && this.grounded && this.currentState !== this.states["roll"] && this.currentState !== this.states["attack"]) {
            this.changeState("roll");
        }

        // Attack input with left click
        if (this.game.click && this.currentState !== this.states["attack"] && this.currentState !== this.states["jump"] && this.currentState !== this.states["roll"]) {
            this.changeState("attack");
            this.game.click = null;  // Reset click to prevent continuous attacking
        }

        // Call parent update (applies physics and runs state logic)
        super.update();
    }

    draw(ctx, game) {
        this.animator.draw(ctx, this.x, this.y);
        // ctx.save();
        // ctx.fillStyle = "#3498db";
        // ctx.fillRect(this.x, this.y, this.width, this.height);
        // ctx.fillStyle = "#fff";
        // ctx.fillText(this.name, this.x + 2, this.y + 16);
        // ctx.restore();
    }
}

export default Player;
