
import Actor from "./actor.js";
import Idle from "../states/idle.js";
import Attack from "../states/attack.js";
import Run from "../states/run.js";
import Jump from "../states/jump.js";
import Roll from "../states/roll.js";
import Fall from "../states/fall.js";

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
        this.wasFalling = false;  // Track if player was falling (to prevent slope snapping mid-air)
        this.coyoteTime = 0;  // Frames since leaving ground (for coyote time)
        // Register states
        this.addState("idle", new Idle());
        this.addState("run", new Run());
        this.addState("jump", new Jump());
        this.addState("fall", new Fall());
        this.addState("roll", new Roll());
        this.addState("attack", new Attack());
        this.changeState("idle");

    }

    onCollision(other) {
        // Handle collision with other entities
        console.log("Player collided with:", other.name);
    }

    update() {
        // Track if player was grounded last frame
        const wasGrounded = this.grounded;

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

        // Track falling state: if we just left the ground and are moving down
        if (wasGrounded && !this.grounded) {
            this.coyoteTime = 0;  // Just left ground
        }

        if (!this.grounded) {
            this.coyoteTime++;
            // If we've been falling for more than a few frames and moving down, enter fall state
            if (this.coyoteTime > 3 && this.vy > 0 &&
                this.currentState !== this.states["fall"] &&
                this.currentState !== this.states["attack"] &&
                this.currentState !== this.states["roll"]) {
                this.wasFalling = true;
                this.changeState("fall");
            }
        } else {
            // Reset when we land
            this.wasFalling = false;
            this.coyoteTime = 0;
        }
    }

    handleTileCollision() {
        const tileMap = this.game.tileMap;
        if (!tileMap) return;

        // Horizontal collision (walls)
        const headY = this.y + 10;
        const midY = this.y + this.height / 2;
        const feetCheckY = this.y + this.height - 10;

        const leftFootX = this.x + 10;
        const rightFootX = this.x + this.width - 10;

        // Check left wall with step-up (only while moving left)
        if (this.vx < 0 && (tileMap.isSolidAtWorld(this.x, headY) ||
            tileMap.isSolidAtWorld(this.x, midY) ||
            tileMap.isSolidAtWorld(this.x, feetCheckY))) {

            // Try to step up (check if there's clearance above)
            let canStepUp = false;
            const maxStepHeight = 16; // Maximum pixels we can step up

            for (let step = 1; step <= maxStepHeight; step++) {
                const testY = this.y - step;
                // Check if at this height, we can move forward
                if (!tileMap.isSolidAtWorld(this.x, testY + 10) &&
                    !tileMap.isSolidAtWorld(this.x, testY + this.height / 2) &&
                    !tileMap.isSolidAtWorld(this.x, testY + this.height - 10)) {
                    // Found a height where we can pass through
                    this.y = testY;
                    canStepUp = true;
                    break;
                }
            }

            // If we can't step up, block horizontal movement
            if (!canStepUp) {
                const tileX = Math.floor(this.x / tileMap.tileWidth);
                this.x = (tileX + 1) * tileMap.tileWidth;
                this.vx = 0;
            }
        }

        // Check right wall with step-up (only while moving right)
        const rightX = this.x + this.width;
        if (this.vx > 0 && (tileMap.isSolidAtWorld(rightX, headY) ||
            tileMap.isSolidAtWorld(rightX, midY) ||
            tileMap.isSolidAtWorld(rightX, feetCheckY))) {

            // Try to step up (check if there's clearance above)
            let canStepUp = false;
            const maxStepHeight = 16; // Maximum pixels we can step up

            for (let step = 1; step <= maxStepHeight; step++) {
                const testY = this.y - step;
                // Check if at this height, we can move forward
                if (!tileMap.isSolidAtWorld(rightX, testY + 10) &&
                    !tileMap.isSolidAtWorld(rightX, testY + this.height / 2) &&
                    !tileMap.isSolidAtWorld(rightX, testY + this.height - 10)) {
                    // Found a height where we can pass through
                    this.y = testY;
                    canStepUp = true;
                    break;
                }
            }

            // If we can't step up, block horizontal movement
            if (!canStepUp) {
                const tileX = Math.floor(rightX / tileMap.tileWidth);
                this.x = tileX * tileMap.tileWidth - this.width;
                this.vx = 0;
            }
        }

        // Ceiling collision (moving up)
        if (this.vy < 0) {
            if (tileMap.isSolidAtWorld(leftFootX, this.y) || tileMap.isSolidAtWorld(rightFootX, this.y)) {
                const tileY = Math.floor(this.y / tileMap.tileHeight);
                this.y = (tileY + 1) * tileMap.tileHeight;
                this.vy = 0;
            }
        }

        // Ground collision with slope support
        const feetY = this.y + this.height;

        // Check for slopes under the player's feet
        const leftTileX = Math.floor(leftFootX / tileMap.tileWidth);
        const leftTileY = Math.floor(feetY / tileMap.tileHeight);
        const rightTileX = Math.floor(rightFootX / tileMap.tileWidth);
        const rightTileY = Math.floor(feetY / tileMap.tileHeight);

        let onSlope = false;
        let slopeY = null;

        // Check left foot position for slope
        const leftSlope = tileMap.getSlopeAt(leftTileX, leftTileY);
        if (leftSlope) {
            const leftSlopeY = leftSlope.getYForX(leftFootX);
            // Only detect slope if we're close to it and moving down or grounded
            if (feetY >= leftSlopeY - 4 && feetY <= leftSlopeY + 4) {
                slopeY = leftSlopeY;
                onSlope = true;
            }
        }

        // Check right foot position for slope
        const rightSlope = tileMap.getSlopeAt(rightTileX, rightTileY);
        if (rightSlope) {
            const rightSlopeY = rightSlope.getYForX(rightFootX);
            // Only detect slope if we're close to it and moving down or grounded
            if (feetY >= rightSlopeY - 4 && feetY <= rightSlopeY + 4) {
                // Use the higher slope (lower Y value) if both feet are on slopes
                if (slopeY === null || rightSlopeY < slopeY) {
                    slopeY = rightSlopeY;
                }
                onSlope = true;
            }
        }

        // If on a slope, snap to slope surface
        if (onSlope && slopeY !== null && this.vy >= 0) {
            // Only snap if we're actually touching the slope (not floating above it)
            const distanceToSlope = feetY - slopeY;

            // If we're falling and far from the slope, don't snap yet
            if (this.wasFalling && distanceToSlope < -8) {
                // Too far above the slope, keep falling
                this.grounded = false;
            } else {
                // Close enough to snap (or walking on slope normally)
                this.y = slopeY - this.height;
                this.grounded = true;
                this.vy = 0;
            }
        } else {
            // Normal flat ground collision
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
    }

    draw(ctx, game) {
        this.animator.draw(ctx, this.x, this.y);

        // Draw hitbox
        // ctx.save();
        // ctx.strokeStyle = "#00ff00";
        // ctx.lineWidth = 2;
        // ctx.strokeRect(this.x, this.y, this.width, this.height);
        // ctx.fillStyle = "#fff";
        // ctx.font = "12px monospace";
        // ctx.fillText(this.name, this.x + 2, this.y + 16);
        // ctx.restore();
    }
}

export default Player;
