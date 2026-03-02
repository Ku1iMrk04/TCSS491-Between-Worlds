
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

const PLAYER_WALL_SAMPLE_INSET = 10;
const PLAYER_MAX_STEP_HEIGHT = 16;
const PLAYER_CEILING_SAMPLE_OFFSET = 10;
const PLAYER_GROUND_SEARCH_DEPTH_TILES = 2;
const PLAYER_GROUND_SEARCH_PADDING_TILES = 1;
const PLAYER_GROUND_AIRBORNE_TOLERANCE = 4;
const PLAYER_GROUND_GROUNDED_TOLERANCE = 32;
const PLAYER_GROUND_LOOKAHEAD_SECONDS = 0.1;
const PLAYER_SLOPE_FALL_SNAP_THRESHOLD = -8;
const PLAYER_TILE_SURFACE_PROBE_OFFSET = 1;

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
        this.speed = 275;
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
        this.dreamSlashCooldown = 0.35;
        this.dreamSlashCooldownTimer = 0;

    }

    onCollision(other) {
        // Handle collision with other entities
        console.log("Player collided with:", other.name);
    }

    update() {
        // Cooldown ticks
        const dt = this.game.clockTick || 0;
        if (this.dashStrikeCooldownTimer > 0) {
            this.dashStrikeCooldownTimer -= dt;
        }
        if (this.dreamSlashCooldownTimer > 0) {
            this.dreamSlashCooldownTimer -= dt;
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
                if (this.inDreamState && this.dreamSlashCooldownTimer <= 0) {
                    this.changeState("dreamslashaim");
                } else {
                    this.changeState("attack");
                }
                this.game.click = null;
            }


        }

        // Track previous Y to support swept landing checks and prevent floor tunneling.
        const previousY = this.y;

        // Call parent update (applies physics and runs state logic)
        super.update();

        // Tilemap collision detection AFTER physics moves the player
        this.handleTileCollision(previousY);

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
                this.currentState !== this.states["roll"] &&
                this.currentState !== this.states["dreamslashaim"] &&
                this.currentState !== this.states["dreamslash"]) {
                this.wasFalling = true;
                this.changeState("fall");
            }
        } else {
            // Reset when we land
            this.wasFalling = false;
            this.coyoteTime = 0;
        }
    }

    handleTileCollision(previousY = this.y) {
        const tileMap = this.game.tileMap;
        if (!tileMap) return;

        // Horizontal collision (walls)
        const headY = this.y + PLAYER_CEILING_SAMPLE_OFFSET;
        const midY = this.y + this.height / 2;
        const feetCheckY = this.y + this.height - PLAYER_WALL_SAMPLE_INSET;

        const leftFootX = this.x + PLAYER_WALL_SAMPLE_INSET;
        const rightFootX = this.x + this.width - PLAYER_WALL_SAMPLE_INSET;
        const centerFootX = this.x + (this.width / 2);

        // Check left wall with step-up (only while moving left)
        if (this.vx < 0 && (tileMap.isSolidAtWorld(this.x, headY) ||
            tileMap.isSolidAtWorld(this.x, midY) ||
            tileMap.isSolidAtWorld(this.x, feetCheckY))) {

            // Try to step up (check if there's clearance above)
            let canStepUp = false;

            for (let step = 1; step <= PLAYER_MAX_STEP_HEIGHT; step++) {
                const testY = this.y - step;
                // Check if at this height, we can move forward
                if (!tileMap.isSolidAtWorld(this.x, testY + PLAYER_CEILING_SAMPLE_OFFSET) &&
                    !tileMap.isSolidAtWorld(this.x, testY + this.height / 2) &&
                    !tileMap.isSolidAtWorld(this.x, testY + this.height - PLAYER_WALL_SAMPLE_INSET)) {
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

            for (let step = 1; step <= PLAYER_MAX_STEP_HEIGHT; step++) {
                const testY = this.y - step;
                // Check if at this height, we can move forward
                if (!tileMap.isSolidAtWorld(rightX, testY + PLAYER_CEILING_SAMPLE_OFFSET) &&
                    !tileMap.isSolidAtWorld(rightX, testY + this.height / 2) &&
                    !tileMap.isSolidAtWorld(rightX, testY + this.height - PLAYER_WALL_SAMPLE_INSET)) {
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
        const previousFeetY = previousY + this.height;
        const landingTolerance = this.grounded ? PLAYER_GROUND_GROUNDED_TOLERANCE : PLAYER_GROUND_AIRBORNE_TOLERANCE;
        const sweepMinY = Math.min(previousFeetY, feetY) - PLAYER_GROUND_AIRBORNE_TOLERANCE;
        const sweepMaxY = Math.max(previousFeetY, feetY) + landingTolerance;

        // Helper function to find ground (slope or solid) at a given X position
        const findGroundAtX = (checkX, maxDepth) => {
            let foundY = null;
            let foundSlope = false;

            // Check around the swept feet range, plus a small search depth below.
            const startTileY = Math.floor(sweepMinY / tileMap.tileHeight) - PLAYER_GROUND_SEARCH_PADDING_TILES;
            const endTileY = Math.floor(sweepMaxY / tileMap.tileHeight) + maxDepth;

            for (let tileY = startTileY; tileY <= endTileY; tileY++) {
                if (tileY < 0 || tileY >= tileMap.height) continue;

                const tileX = Math.floor(checkX / tileMap.tileWidth);
                if (tileX < 0 || tileX >= tileMap.width) continue;

                // First check for slopes
                const slope = tileMap.getSlopeAt(tileX, tileY);
                if (slope) {
                    const slopeYAtX = slope.getYForX(checkX);
                    if (slopeYAtX >= sweepMinY && slopeYAtX <= sweepMaxY) {
                        if (foundY === null || slopeYAtX < foundY) {
                            foundY = slopeYAtX;
                            foundSlope = true;
                        }
                    }
                }

                // Also check for solid tiles
                const tileTopY = tileY * tileMap.tileHeight;
                const solidProbeY = tileTopY + PLAYER_TILE_SURFACE_PROBE_OFFSET;
                if (tileMap.isSolidAtWorld(checkX, solidProbeY) && tileTopY >= sweepMinY && tileTopY <= sweepMaxY) {
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
            { x: centerFootX, label: "center" },
            { x: rightFootX, label: "right" }
        ];

        // If grounded and moving horizontally, also check future positions
        if (this.grounded && Math.abs(this.vx) > 0) {
            const futureLeftX = leftFootX + this.vx * PLAYER_GROUND_LOOKAHEAD_SECONDS;
            const futureCenterX = centerFootX + this.vx * PLAYER_GROUND_LOOKAHEAD_SECONDS;
            const futureRightX = rightFootX + this.vx * PLAYER_GROUND_LOOKAHEAD_SECONDS;
            checkPositions.push(
                { x: futureLeftX, label: "future-left" },
                { x: futureCenterX, label: "future-center" },
                { x: futureRightX, label: "future-right" }
            );
        }

        // Find the highest ground among all check positions
        let groundY = null;
        let isOnSlope = false;
        const maxSearchDepth = PLAYER_GROUND_SEARCH_DEPTH_TILES;

        for (const pos of checkPositions) {
            const ground = findGroundAtX(pos.x, maxSearchDepth);
            if (ground.y !== null) {
                // Keep compatibility with previous grounded-vs-airborne snap behavior.
                if (ground.y <= feetY + landingTolerance) {
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
            if (this.wasFalling && distanceToGround < PLAYER_SLOPE_FALL_SNAP_THRESHOLD) {
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
        const attackState = this.states["attack"];
        const isAttacking = this.currentState === attackState;

        if (isAttacking) {
            const dx = attackState.attackDirX;
            const dy = attackState.attackDirY;
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;

            ctx.save();
            ctx.translate(cx, cy);

            if (dx < 0) {
                // Mirror on X then rotate by reflected angle (same as slash logic)
                ctx.scale(-1, 1);
                ctx.rotate(Math.atan2(dy, -dx));
            } else {
                ctx.rotate(Math.atan2(dy, dx));
            }

            // Temporarily force "right" so the animator doesn't apply its own
            // internal flip — our external transform already handles direction.
            const prevDir = this.animator.direction;
            this.animator.direction = "right";
            this.animator.draw(ctx, -this.width / 2, -this.height / 2);
            this.animator.direction = prevDir;

            ctx.restore();
        } else {
            this.animator.draw(ctx, this.x, this.y);
        }

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
