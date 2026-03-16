
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

        // Hitbox dimensions for each form
        this.kidWidth = 23 * this.scale;
        this.kidHeight = 27 * this.scale;
        this.ninjaWidth = 33 * this.scale;
        this.ninjaHeight = 34 * this.scale;

        // Start with kid dimensions (normal form)
        this.width = this.kidWidth;
        this.height = this.kidHeight;
        this.setCollider({ layer: "player" });

        // Normal state animator
        this.normalAnimator = new Animator("kid", this.game.assetManager);
        this.normalAnimator.setScale(this.scale);

        // Dream state animator
        this.dreamAnimator = new Animator("ninja", this.game.assetManager);
        this.dreamAnimator.setScale(this.scale);

        // Adjust sprite position to align top of sprite with hitbox top
        // Ninja max height is 43px (airborne), idle is 34px, creating a 9px offset
        // We want the sprite top-aligned with hitbox, so negate the bottom-alignment
        const maxHeight = 43; // airborne animation height
        const playerHeight = 34; // idle animation height
        this.normalAnimator.setVerticalAdjustment(-(maxHeight - playerHeight) * this.scale);
        this.dreamAnimator.setVerticalAdjustment(-(maxHeight - playerHeight) * this.scale);

        // Start with normal animator active
        this.animator = this.normalAnimator;
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

        // Roll cooldown
        this.rollCooldown = 0.3;
        this.rollCooldownTimer = 0;

        // Dash Strike cooldown
        this.dashStrikeCooldown = 3.0;
        this.dashStrikeCooldownTimer = 0;
        this.dashStrikeTarget = null;
        this.dashStrikeMaxRange = 300;

        // Dream State
        this.dreamMeter = 1;
        this.dreamMeterMax = 1;
        this.inDreamState = false;
        this.dreamDrainRate = 0.12;
        this.dreamMeterRechargeRate = 0.08;
        this.dreamMeterChargePerHit = 0.08;
        this.dreamBlinkCost = 0.15;
        this.dreamSpeedMultiplier = 1.5;
        this.dreamSlashTargetX = 0;
        this.dreamSlashTargetY = 0;
        this.dreamSlashCooldown = 0.35;
        this.dreamSlashCooldownTimer = 0;

        // Dream particle trail
        this.dreamParticles = [];
        this.dreamParticleTimer = 0;

        // Death state
        this.isDead = false;
        this.deathAnimationComplete = false;
    }

    onDeath() {
        // Override Actor's onDeath to play death animation instead of removing immediately
        if (this.isDead) return;
        this.isDead = true;
        this.vx = 0;
        this.vy = 0;

        // If in dream state, switch back to normal form for death animation
        if (this.inDreamState) {
            this.inDreamState = false;

            // Switch to normal animator
            this.animator = this.normalAnimator;

            // Resize hitbox back to kid dimensions
            const widthDiff = this.width - this.kidWidth;
            const heightDiff = this.height - this.kidHeight;
            this.width = this.kidWidth;
            this.height = this.kidHeight;
            // Center the hitbox horizontally and keep feet position
            this.x += widthDiff / 2;
            this.y += heightDiff;

            // Reset speed
            this.speed /= this.dreamSpeedMultiplier;
        }

        // Play death animation
        if (this.animator) {
            this.animator.setAnimation("die", this.facing, false);
        }

        // Stop dream state music if active
        if (this.game.soundManager) {
            this.game.soundManager.stopMusic();
        }
    }

    onCollision(other) {
        // Handle collision with other entities
        console.log("Player collided with:", other.name);
    }

    update() {
        // If dead, skip all normal update logic except animation
        if (this.isDead) {
            if (this.animator) {
                this.animator.update(this.game.clockTick);
                // Check if death animation is complete (on last frame of non-looping animation)
                const anim = this.animator.spriteAtlas?.metadata?.animations?.[this.animator.currAnimationName];
                if (anim && !this.animator.isLooping && this.animator.currentFrame >= anim.frameCount - 1) {
                    this.deathAnimationComplete = true;
                    this.removeFromWorld = true; // Trigger death scene transition
                }
            }
            return;
        }

        // Cooldown ticks
        const dt = this.game.clockTick || 0;
        if (this.dashStrikeCooldownTimer > 0) {
            this.dashStrikeCooldownTimer -= dt;
        }
        if (this.rollCooldownTimer > 0) {
            this.rollCooldownTimer -= dt;
        }
        if (this.dreamSlashCooldownTimer > 0) {
            this.dreamSlashCooldownTimer -= dt;
        }

        // Dream particle trail - update existing particles
        for (let i = this.dreamParticles.length - 1; i >= 0; i--) {
            const p = this.dreamParticles[i];
            p.alpha -= dt * 4;
            p.radius += dt * 8;
            if (p.alpha <= 0) this.dreamParticles.splice(i, 1);
        }

        // Dream state drain / passive recharge
        if (this.inDreamState) {
            this.dreamMeter -= this.dreamDrainRate * dt;
            if (this.dreamMeter <= 0) {
                this.dreamMeter = 0;
                this.inDreamState = false;

                // SWAP BACK TO NORMAL ANIMATOR
                const currentAnimation = this.animator.currAnimationName;
                const currentDirection = this.animator.direction;
                this.animator = this.normalAnimator;
                this.animator.setAnimation(currentAnimation, currentDirection, true);

                // RESIZE HITBOX BACK TO KID DIMENSIONS
                const widthDiff = this.width - this.kidWidth;
                const heightDiff = this.height - this.kidHeight;
                this.width = this.kidWidth;
                this.height = this.kidHeight;
                // Center the hitbox horizontally and keep feet position
                this.x += widthDiff / 2;
                this.y += heightDiff;

                this.speed /= this.dreamSpeedMultiplier;
                if (this.game.soundManager) this.game.soundManager.playMusic("gameplay");
            }
        } else {
            this.dreamMeter = Math.min(this.dreamMeterMax, this.dreamMeter + this.dreamMeterRechargeRate * dt);
        }

        // Spawn dream particles while in dream state
        if (this.inDreamState) {
            this.dreamParticleTimer -= dt;
            if (this.dreamParticleTimer <= 0) {
                this.dreamParticleTimer = 0.04;
                this.dreamParticles.push({
                    x: this.x + this.width / 2 + (Math.random() - 0.5) * 10,
                    y: this.y + this.height / 2 + (Math.random() - 0.5) * 10,
                    alpha: 0.55,
                    radius: 5
                });
            }
        }

        // Dream state activation (E key)
        if (this.game.eKey && !this.inDreamState && this.dreamMeter >= this.dreamMeterMax) {
            this.inDreamState = true;

            // SWAP TO DREAM ANIMATOR
            const currentAnimation = this.animator.currAnimationName;
            const currentDirection = this.animator.direction;
            this.animator = this.dreamAnimator;
            this.animator.setAnimation(currentAnimation, currentDirection, true);

            // RESIZE HITBOX TO NINJA DIMENSIONS
            const widthDiff = this.ninjaWidth - this.width;
            const heightDiff = this.ninjaHeight - this.height;
            this.width = this.ninjaWidth;
            this.height = this.ninjaHeight;
            // Center the hitbox horizontally and keep feet position
            this.x -= widthDiff / 2;
            this.y -= heightDiff;

            this.speed *= this.dreamSpeedMultiplier;
            this.game.eKey = false;
            if (this.game.soundManager) {
                this.game.soundManager.playSfx("dreamActivate");
                this.game.soundManager.playMusic("dream");
            }
        }

        // Track if player was grounded last frame
        const wasGrounded = this.grounded;

        this.dashStrikeTarget = this._findClosestEnemyInRange();

        const isAiming = this.currentState === this.states["dashstrikeaim"];
        const isDashing = this.currentState === this.states["dashstrike"];
        const isBlinking = this.currentState === this.states["dreamslash"];
        // Block all other inputs while aiming, dashing, or blinking
        if (!isAiming && !isDashing && !isBlinking) {
            // Jump input (only when grounded and not attacking/rolling)
            if (this.game.space && this.grounded && this.currentState !== this.states["attack"] && this.currentState !== this.states["roll"]) {
                this.changeState("jump");
            }

            // Roll input (left shift - only when grounded and not already rolling/attacking)
            if (this.game.shift && this.grounded && this.currentState !== this.states["roll"] && this.currentState !== this.states["attack"] && this.rollCooldownTimer <= 0) {
                this.rollCooldownTimer = this.rollCooldown;
                this.changeState("roll");
            }

            // Attack input with left click (can attack mid-air)
            if (this.game.click && this.currentState !== this.states["attack"] && this.currentState !== this.states["roll"]) {
                // Capture attack direction RIGHT NOW at click time for maximum responsiveness
                let atkDx = 0, atkDy = 0;
                if (this.game.left) atkDx = -1;
                else if (this.game.right) atkDx = 1;
                if (this.game.up) atkDy = -1;
                else if (this.game.down) atkDy = 1;
                if (atkDx === 0 && atkDy === 0) {
                    if (!this.grounded && this.vy > 0) {
                        atkDy = 1;
                    } else {
                        atkDx = this.facing === "left" ? -1 : 1;
                    }
                }
                this.pendingAttackDirX = atkDx;
                this.pendingAttackDirY = atkDy;

                if (this.inDreamState && this.dreamSlashCooldownTimer <= 0) {
                    // Compute dash direction from WASD input (same as normal attack)
                    const maxDist = this.states["dreamslashaim"].maxDashDistance;
                    let dx = atkDx, dy = atkDy;
                    if (dx !== 0 && dy !== 0) {
                        dx /= Math.SQRT2;
                        dy /= Math.SQRT2;
                    }
                    const cx = this.x + this.width / 2;
                    const cy = this.y + this.height / 2;
                    this.dreamSlashTargetX = cx + dx * maxDist;
                    this.dreamSlashTargetY = cy + dy * maxDist;
                    this.changeState("dreamslash");
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
        const sweepMinY = Math.min(previousFeetY, feetY) - (PLAYER_GROUND_AIRBORNE_TOLERANCE + PLAYER_WALL_SAMPLE_INSET);
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

        // Find the ground closest to current feet among all check positions
        // (not just highest) — prevents snapping through floors at slope-to-flat transitions
        let groundY = null;
        let isOnSlope = false;
        const maxSearchDepth = PLAYER_GROUND_SEARCH_DEPTH_TILES;

        for (const pos of checkPositions) {
            const ground = findGroundAtX(pos.x, maxSearchDepth);
            if (ground.y !== null) {
                // Keep compatibility with previous grounded-vs-airborne snap behavior.
                if (ground.y <= feetY + landingTolerance) {
                    if (groundY === null || Math.abs(ground.y - feetY) < Math.abs(groundY - feetY)) {
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
        // Draw dream particle trail behind player
        for (const p of this.dreamParticles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = "#cc44ff";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        const attackState = this.states["attack"];
        const isAttacking = this.currentState === attackState;

        // Only show slash visual effect when in dream state
        if (isAttacking && this.inDreamState) {
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
