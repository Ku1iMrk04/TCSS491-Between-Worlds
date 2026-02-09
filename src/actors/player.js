
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
        this.scale = 2;
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
        // Jump input (only when grounded and not attacking/rolling)
        if (this.game.space && this.grounded && this.currentState !== this.states["attack"] && this.currentState !== this.states["roll"]) {
            this.changeState("jump");
        }

        // Roll input (left shift - only when grounded and not already rolling/attacking)
        if (this.game.shift && this.grounded && this.currentState !== this.states["roll"] && this.currentState !== this.states["attack"]) {
            this.changeState("roll");
        }

        // Attack input with left click (can attack mid-air)
        if (this.game.click && this.currentState !== this.states["attack"] && this.currentState !== this.states["roll"]) {
            this.changeState("attack");
            this.game.click = null;  // Reset click to prevent continuous attacking
        }

        // Call parent update (applies physics and runs state logic)
        super.update();

        // Tilemap collision detection AFTER physics moves the player
        this.handleTileCollision();
    }

    handleTileCollision() {
        const tileMap = this.game.tileMap;
        if (!tileMap) return;

        // Horizontal collision (walls)
        const headY = this.y + 10;
        const midY = this.y + this.height / 2;
        const feetCheckY = this.y + this.height - 10;

        // Check left wall
        if (tileMap.isSolidAtWorld(this.x, headY) ||
            tileMap.isSolidAtWorld(this.x, midY) ||
            tileMap.isSolidAtWorld(this.x, feetCheckY)) {
            const tileX = Math.floor(this.x / tileMap.tileWidth);
            this.x = (tileX + 1) * tileMap.tileWidth;
            this.vx = 0;
        }

        // Check right wall
        const rightX = this.x + this.width;
        if (tileMap.isSolidAtWorld(rightX, headY) ||
            tileMap.isSolidAtWorld(rightX, midY) ||
            tileMap.isSolidAtWorld(rightX, feetCheckY)) {
            const tileX = Math.floor(rightX / tileMap.tileWidth);
            this.x = tileX * tileMap.tileWidth - this.width;
            this.vx = 0;
        }

        // Vertical collision
        const leftFootX = this.x + 10;
        const rightFootX = this.x + this.width - 10;

        // Ceiling collision (moving up)
        if (this.vy < 0) {
            if (tileMap.isSolidAtWorld(leftFootX, this.y) || tileMap.isSolidAtWorld(rightFootX, this.y)) {
                const tileY = Math.floor(this.y / tileMap.tileHeight);
                this.y = (tileY + 1) * tileMap.tileHeight;
                this.vy = 0;
            }
        }

        // Ground collision (moving down or standing)
        const feetY = this.y + this.height;
        const leftGrounded = tileMap.isSolidAtWorld(leftFootX, feetY);
        const rightGrounded = tileMap.isSolidAtWorld(rightFootX, feetY);

        if ((leftGrounded || rightGrounded) && this.vy >= 0) {
            // Snap to top of tile
            const tileY = Math.floor(feetY / tileMap.tileHeight);
            this.y = tileY * tileMap.tileHeight - this.height;
            this.grounded = true;
            this.vy = 0;
        } else {
            this.grounded = false;
        }
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
