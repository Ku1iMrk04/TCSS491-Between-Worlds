
import Actor from "./actor.js";
import Idle from "../states/idle.js";
import Attack from "../states/attack.js";
import Run from "../states/run.js";
import Jump from "../states/jump.js";
import Roll from "../states/roll.js";
import DashStrike from "../states/dashstrike.js";
import DashStrikeAim from "../states/dashstrikeaim.js";
import Fall from "../states/fall.js";
import DreamSlash from "../states/dreamslash.js";
import DreamSlashAim from "../states/dreamslashaim.js";

import Animator from "../animation/animator.js";
class Player extends Actor {
    constructor(game, x, y) {
        super(game, x, y);
        this.name = "Player";
        this.facing = "right";  // Direction player is facing
        this.scale = 2;
        this.width = 39 * this.scale;
        this.height = 39 * this.scale;
        this.setCollider({ layer: "player" });
        this.animator = new Animator("zero", this.game.assetManager)
        this.animator.setScale(this.scale);
        this.speed = 200;
        this.currentAnimState = "idle";  // Track current animation state
        this.wasFalling = false;  // Track if player was falling (to prevent slope snapping mid-air)
        this.coyoteTime = 0;  // Frames since leaving ground (for coyote time)
        this.onSlope = false;  // Track if player is currently on a slope
        // Register states
        this.addState("idle", new Idle());
        this.addState("run", new Run());
        this.addState("jump", new Jump());
        this.addState("fall", new Fall());
        this.addState("roll", new Roll());
        this.addState("attack", new Attack());
        this.addState("dashstrike", new DashStrike());
        this.addState("dashstrikeaim", new DashStrikeAim());
        this.addState("dreamslash", new DreamSlash());
        this.addState("dreamslashaim", new DreamSlashAim());
        this.changeState("idle");

        // Dash Strike cooldown
        this.dashStrikeCooldown = 3.0;
        this.dashStrikeCooldownTimer = 0;
        this.dashStrikeTarget = null;
        this.dashStrikeMaxRange = 300;

        // Dream State
        this.dreamMeter = 1;
        this.dreamMeterMax = 1;
        this.dreamMeterChargePerHit = 0.15;
        this.inDreamState = false;
        this.dreamDrainRate = 0.08;
        this.dreamBlinkCost = 0.15;
        this.dreamSpeedMultiplier = 1.5;
        this.dreamSlashTargetX = 0;
        this.dreamSlashTargetY = 0;

    }

    onCollision(other) {
        // Handle collision with other entities
        console.log("Player collided with:", other.name);
    }

    update() {
        // Dash Strike cooldown tick and target scanning
        const dt = this.game.clockTick || 0;
        if (this.dashStrikeCooldownTimer > 0) {
            this.dashStrikeCooldownTimer -= dt;
        }

        // Dream state drain
        if (this.inDreamState) {
            this.dreamMeter -= this.dreamDrainRate * dt;
            if (this.dreamMeter <= 0) {
                this.dreamMeter = 0;
                this.inDreamState = false;
                this.speed /= this.dreamSpeedMultiplier;
            }
        }

        // Dream state activation (E key)
        if (this.game.eKey && !this.inDreamState && this.dreamMeter >= this.dreamMeterMax) {
            this.inDreamState = true;
            this.speed *= this.dreamSpeedMultiplier;
            this.game.eKey = false;
        }

        // Track if player was grounded last frame
        const wasGrounded = this.grounded;

        this.dashStrikeTarget = this._findClosestEnemyInRange();

        const isAiming = this.currentState === this.states["dashstrikeaim"];
        const isDashing = this.currentState === this.states["dashstrike"];
        const isBlinking = this.currentState === this.states["dreamslash"];
        const isDreamAiming = this.currentState === this.states["dreamslashaim"];

        // Block all other inputs while aiming, dashing, or blinking
        if (!isAiming && !isDashing && !isBlinking && !isDreamAiming) {
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
                if (this.inDreamState) {
                    this.changeState("dreamslashaim");
                } else {
                    this.changeState("attack");
                }
                this.game.click = null;
            }

            // Dash Strike input - right mouse button (disabled in dream state)
            if (!this.inDreamState && this.game.rightclick) {
                if (this.dashStrikeCooldownTimer <= 0
                    && this.currentState !== this.states["roll"]
                    && this.dashStrikeTarget) {
                    this.dashStrikeCooldownTimer = this.dashStrikeCooldown;
                    this.changeState("dashstrikeaim");
                }
                this.game.rightclick = null;
            }
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

        // Check right wall with step-up (only when moving right)
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

        // Ground collision with slope support using movement-aware detection
        const feetY = this.y + this.height;

        // Helper function to find ground (slope or solid) at a given X position
        const findGroundAtX = (checkX, maxDepth) => {
            let foundY = null;
            let foundSlope = false;

            // Check up to maxDepth tiles below
            const startTileY = Math.floor(feetY / tileMap.tileHeight);
            const endTileY = startTileY + maxDepth;

            for (let tileY = startTileY; tileY <= endTileY; tileY++) {
                const tileX = Math.floor(checkX / tileMap.tileWidth);

                // First check for slopes
                const slope = tileMap.getSlopeAt(tileX, tileY);
                if (slope) {
                    const slopeYAtX = slope.getYForX(checkX);
                    // Only consider slopes at or below current feet position
                    if (slopeYAtX >= feetY - 4) {
                        if (foundY === null || slopeYAtX < foundY) {
                            foundY = slopeYAtX;
                            foundSlope = true;
                        }
                    }
                }

                // Also check for solid tiles
                const tileTopY = tileY * tileMap.tileHeight;
                if (tileMap.isSolidAtWorld(checkX, tileTopY) && tileTopY >= feetY - 4) {
                    if (foundY === null || tileTopY < foundY) {
                        foundY = tileTopY;
                        foundSlope = false;
                    }
                }
            }

            return { y: foundY, isSlope: foundSlope };
        };

        // Positions to check: current feet positions
        const checkPositions = [
            { x: leftFootX, label: "left" },
            { x: rightFootX, label: "right" }
        ];

        // If grounded and moving horizontally, also check future positions
        if (this.grounded && Math.abs(this.vx) > 0) {
            const futureLeftX = leftFootX + this.vx * 0.1;  // Look ahead based on velocity
            const futureRightX = rightFootX + this.vx * 0.1;
            checkPositions.push(
                { x: futureLeftX, label: "future-left" },
                { x: futureRightX, label: "future-right" }
            );
        }

        // Find the highest ground among all check positions
        let groundY = null;
        let isOnSlope = false;
        const maxSearchDepth = 2; // Check up to 2 tiles down

        for (const pos of checkPositions) {
            const ground = findGroundAtX(pos.x, maxSearchDepth);
            if (ground.y !== null) {
                // If grounded, use looser tolerance; if falling, use strict tolerance
                const tolerance = this.grounded ? 32 : 4;

                // Only consider ground within tolerance distance
                if (ground.y <= feetY + tolerance) {
                    if (groundY === null || ground.y < groundY) {
                        groundY = ground.y;
                        isOnSlope = ground.isSlope;
                    }
                }
            }
        }

        // Apply ground collision
        if (groundY !== null && this.vy >= 0) {
            const distanceToGround = feetY - groundY;

            // If we're falling from a jump and far above ground, don't snap yet
            if (this.wasFalling && distanceToGround < -8) {
                this.grounded = false;
                this.onSlope = false;
            } else {
                // Snap to ground
                this.y = groundY - this.height;
                this.grounded = true;
                this.onSlope = isOnSlope;
                this.vy = 0;
            }
        } else {
            // No ground found - player is airborne
            this.grounded = false;
            this.onSlope = false;
        }
    }

    draw(ctx, game) {
        this.animator.draw(ctx, this.x, this.y);

        // Draw crosshair on targeted enemy when ability is ready
        if (this.dashStrikeTarget && this.dashStrikeCooldownTimer <= 0
            && this.currentState !== this.states["dashstrikeaim"]) {
            this._drawCrosshair(ctx, this.dashStrikeTarget);
        }

        // Draw skill shot bar during aiming
        if (this.currentState === this.states["dashstrikeaim"]) {
            this._drawSkillShotBar(ctx);
        }

        // Draw dream slash aim line
        if (this.currentState === this.states["dreamslashaim"]) {
            this.states["dreamslashaim"].drawAimLine(ctx);
        }
    }

    _findClosestEnemyInRange() {
        const entities = this.game.entities;
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        let closest = null;
        let closestDist = Infinity;

        for (let i = 0; i < entities.length; i++) {
            const e = entities[i];
            if (!e.collider || e.collider.layer !== "enemy") continue;
            if (e.removeFromWorld) continue;
            if (e.state === "dead") continue;

            const ex = e.x + e.width / 2;
            const ey = e.y + e.height / 2;
            const dist = Math.hypot(ex - centerX, ey - centerY);

            if (dist <= this.dashStrikeMaxRange && dist < closestDist) {
                closest = e;
                closestDist = dist;
            }
        }

        return closest;
    }

    _drawSkillShotBar(ctx) {
        const aimState = this.states["dashstrikeaim"];
        const progress = aimState.barProgress;
        const sweetStart = aimState.sweetSpotStart;
        const sweetEnd = aimState.sweetSpotEnd;

        const barW = 120;
        const barH = 10;
        const barX = this.x + this.width / 2 - barW / 2;
        const barY = this.y - 30;

        ctx.save();

        // Bar background
        ctx.fillStyle = "#333";
        ctx.fillRect(barX, barY, barW, barH);

        // Sweet spot zone (green)
        ctx.fillStyle = "#2ecc71";
        ctx.fillRect(barX + barW * sweetStart, barY, barW * (sweetEnd - sweetStart), barH);

        // Needle (white line)
        const needleX = barX + barW * Math.min(progress, 1);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(needleX, barY - 3);
        ctx.lineTo(needleX, barY + barH + 3);
        ctx.stroke();

        // Border
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);

        // "RELEASE!" text when needle is in sweet spot
        if (progress >= sweetStart && progress <= sweetEnd) {
            ctx.fillStyle = "#2ecc71";
            ctx.font = "8px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillText("RELEASE!", this.x + this.width / 2, barY - 5);
        }

        ctx.restore();
    }

    _drawCrosshair(ctx, target) {
        const cx = target.x + target.width / 2;
        const cy = target.y + target.height / 2;
        const radius = 20;

        ctx.save();
        ctx.strokeStyle = "#ff3333";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;

        // Outer circle
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Inner circle
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.4, 0, Math.PI * 2);
        ctx.stroke();

        // Cross lines
        const outer = radius + 8;
        const inner = radius * 0.4;

        ctx.beginPath();
        ctx.moveTo(cx - outer, cy);
        ctx.lineTo(cx - inner, cy);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx + inner, cy);
        ctx.lineTo(cx + outer, cy);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, cy - outer);
        ctx.lineTo(cx, cy - inner);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(cx, cy + inner);
        ctx.lineTo(cx, cy + outer);
        ctx.stroke();

        ctx.restore();
    }
}

export default Player;
