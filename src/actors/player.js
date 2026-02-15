
import Actor from "./actor.js";
import Idle from "../states/idle.js";
import Attack from "../states/attack.js";
import Run from "../states/run.js";
import Jump from "../states/jump.js";
import Roll from "../states/roll.js";
import DashStrike from "../states/dashstrike.js";
import DashStrikeAim from "../states/dashstrikeaim.js";

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
        this.addState("dashstrike", new DashStrike());
        this.addState("dashstrikeaim", new DashStrikeAim());
        this.changeState("idle");

        // Dash Strike cooldown
        this.dashStrikeCooldown = 3.0;
        this.dashStrikeCooldownTimer = 0;
        this.dashStrikeTarget = null;
        this.dashStrikeMaxRange = 300;

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
        this.dashStrikeTarget = this._findClosestEnemyInRange();

        const isAiming = this.currentState === this.states["dashstrikeaim"];
        const isDashing = this.currentState === this.states["dashstrike"];

        // Block all other inputs while aiming or dashing
        if (!isAiming && !isDashing) {
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

            // Dash Strike input - right mouse button pressed down
            if (this.game.rightclick) {
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

        // Draw crosshair on targeted enemy when ability is ready
        if (this.dashStrikeTarget && this.dashStrikeCooldownTimer <= 0
            && this.currentState !== this.states["dashstrikeaim"]) {
            this._drawCrosshair(ctx, this.dashStrikeTarget);
        }

        // Draw skill shot bar during aiming
        if (this.currentState === this.states["dashstrikeaim"]) {
            this._drawSkillShotBar(ctx);
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
