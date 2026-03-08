import Actor from "./actor.js";
import AttackHitbox from "../collision/attackhitbox.js";
import Animator from "../animation/animator.js";

class Enemy extends Actor {
    constructor(game, x, y) {
        super(game, x, y);
        this.ai = null;
        this.name = "Enemy";
        this.scale = 2;
        this.width = 22 * this.scale;
        this.height = 40 * this.scale;
        this.setCollider({ layer: "enemy" });

        this.health = 40;
        this.contactDamage = 10;
        this.damage = 10;  // Damage dealt to player on contact

        this.state = "idle";  // Possible states: idle, chase, waitingToAttack, attacking
        this.aggroRange = 420;
        this.attackRange = 40;
        this.verticalAwareness = 80; // Detect/chase targets on the same floor with a bit more tolerance
        this.stairVerticalAwareness = 320; // Keep chase active through taller stair height differences
        this.secondFloorY = 240; // Map-specific upper floor cutoff (smaller Y = higher on map)
        this.floorTransitionBuffer = 72; // Avoid dropping aggro while targets are still moving through stairs
        this.stairPursuitGrace = 1.25; // Keep pursuit active briefly after the player exits the stairs
        this.stairPursuitTimer = 0;
        this.horizontalDeadzone = 6; // Prevent jitter when target is almost perfectly aligned in X
        this.speed = 30;

        // Vision cone properties
        this.visionRange = 420; // Distance the enemy can see
        this.visionAngle = 180; // Cone width in degrees (180 = 90 degree cone on each side)

        // attack timing
        this.attackCooldown = 0.9; // seconds
        this.attackTimer = 0;
        this.attackDelay = 1.0; // Delay before first attack
        this.attackDelayTimer = 0;

        // Tracking player and last seen position
        this.player = null;
        this.lastSeenPlayerPos = null; // { x, y }
        this.hasSeenPlayer = false; // Whether enemy has ever seen the player

        // facing hitbox placement
        this.facing = "left";
        this.animator = new Animator("enemy_scientist", this.game.assetManager);
        this.animator.setScale(this.scale);
        this.idleAnimation = "idle";
        this.chaseAnimation = "walk";
        this.attackAnimation = "idle";
        this.wasFalling = false;
    }

    findPlayer() {
        if (this.player && !this.player.removeFromWorld) {
            return this.player;
        }

        const entities = this.game.entities || this.game.gameEngine?.entities || [];
        this.player = entities.find(e => e && e.name === "Player") || null;
        return this.player;
    }

    createTargetSnapshot(target) {
        if (!target) return null;

        return {
            x: target.x,
            y: target.y,
            width: target.width,
            height: target.height
        };
    }

    /**
     * Check if player is in the enemy's vision cone
     * Vision cone is a cone in front of the enemy
     */
    isPlayerInVisionCone(player) {
        if (!player) return false;

        const enemyCenterX = this.x + (this.width / 2);
        const enemyCenterY = this.y + (this.height / 2);
        const playerCenterX = player.x + (player.width / 2);
        const playerCenterY = player.y + (player.height / 2);

        const dx = playerCenterX - enemyCenterX;
        const dy = playerCenterY - enemyCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Check if player is within vision range
        if (distance > this.visionRange) {
            return false;
        }

        // Check if player is in front of enemy (within cone angle)
        const directionFromEnemy = Math.atan2(dy, dx);
        const enemyFacingDirection = this.facing === "right" ? 0 : Math.PI;

        // Calculate angle difference (in radians)
        let angleDiff = Math.abs(directionFromEnemy - enemyFacingDirection);

        // Normalize to 0-π
        if (angleDiff > Math.PI) {
            angleDiff = 2 * Math.PI - angleDiff;
        }

        // Convert vision angle (half angle on each side) to radians
        const maxAngleDiff = (this.visionAngle / 2) * (Math.PI / 180);

        return angleDiff <= maxAngleDiff;
    }

    /**
     * Check whether a wall blocks the direct line between enemy and player.
     */
    canSeePlayerClearly(player) {
        if (!player) return false;

        const tileMap = this.game.tileMap;
        if (!tileMap) return true;

        const startX = this.x + (this.width / 2);
        const startY = this.y + (this.height / 2);
        const endX = player.x + (player.width / 2);
        const endY = player.y + (player.height / 2);
        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) {
            return true;
        }

        const sampleSpacing = Math.max(4, Math.min(tileMap.tileWidth, tileMap.tileHeight) / 2);
        const sampleCount = Math.ceil(distance / sampleSpacing);

        for (let i = 1; i < sampleCount; i++) {
            const t = i / sampleCount;
            const sampleX = startX + (dx * t);
            const sampleY = startY + (dy * t);

            if (tileMap.isSolidAtWorld(sampleX, sampleY)) {
                const tileX = Math.floor(sampleX / tileMap.tileWidth);
                const tileY = Math.floor(sampleY / tileMap.tileHeight);
                if (tileMap.getSlopeAt(tileX, tileY)) {
                    continue;
                }
                return false;
            }
        }

        return true;
    }

    canCurrentlySeePlayer(player) {
        return this.isPlayerInVisionCone(player) && this.canSeePlayerClearly(player);
    }

    clearTargetMemory() {
        this.lastSeenPlayerPos = null;
        this.hasSeenPlayer = false;
    }

    hasReachedTargetPosition(targetPos) {
        if (!targetPos) return false;

        const enemyCenterX = this.x + (this.width / 2);
        const enemyCenterY = this.y + (this.height / 2);
        const targetCenterX = targetPos.x + ((targetPos.width ?? 0) / 2);
        const targetCenterY = targetPos.y + ((targetPos.height ?? 0) / 2);
        const horizontalTolerance = Math.max(this.horizontalDeadzone * 2, 14);
        const verticalTolerance = Math.max(this.height / 2, 32);

        return Math.abs(targetCenterX - enemyCenterX) <= horizontalTolerance &&
            Math.abs(targetCenterY - enemyCenterY) <= verticalTolerance;
    }

    getTargetContext(player) {
        const canSeePlayer = this.canCurrentlySeePlayer(player);
        let targetPos = null;

        if (canSeePlayer) {
            targetPos = this.createTargetSnapshot(player);
            this.lastSeenPlayerPos = targetPos;
            this.hasSeenPlayer = true;
        } else if (this.hasSeenPlayer) {
            targetPos = this.createTargetSnapshot(player);
        } else if (this.lastSeenPlayerPos) {
            targetPos = this.lastSeenPlayerPos;
        }

        if (!targetPos) {
            return {
                canSeePlayer,
                targetPos: null,
                centerDx: 0,
                horizontalDist: 0,
                horizontalGap: 0,
                verticalDist: 0,
                canEngage: false,
                targetReached: false
            };
        }

        const targetWidth = targetPos.width ?? player.width ?? 0;
        const targetHeight = targetPos.height ?? player.height ?? 0;
        const targetCenterX = targetPos.x + (targetWidth / 2);
        const targetCenterY = targetPos.y + (targetHeight / 2);
        const enemyCenterX = this.x + (this.width / 2);
        const enemyCenterY = this.y + (this.height / 2);
        const centerDx = targetCenterX - enemyCenterX;
        const horizontalDist = Math.abs(centerDx);
        const horizontalGap = Math.max(
            0,
            Math.max(
                targetPos.x - (this.x + this.width),
                this.x - (targetPos.x + targetWidth)
            )
        );
        const verticalDist = Math.abs(targetCenterY - enemyCenterY);
        const targetOnSlope = this.isOnSlope({
            x: targetPos.x,
            y: targetPos.y,
            width: targetWidth,
            height: targetHeight
        });
        const enemyOnSlope = this.isOnSlope(this);
        const targetNearFloorTransition = Math.abs(targetCenterY - this.secondFloorY) <= this.floorTransitionBuffer;
        const enemyNearFloorTransition = Math.abs(enemyCenterY - this.secondFloorY) <= this.floorTransitionBuffer;
        const stairTransitionActive = targetOnSlope || enemyOnSlope ||
            targetNearFloorTransition || enemyNearFloorTransition;
        if (stairTransitionActive && (canSeePlayer || this.hasSeenPlayer)) {
            this.stairPursuitTimer = this.stairPursuitGrace;
        }
        const stairPursuitActive = stairTransitionActive || this.stairPursuitTimer > 0;
        const verticalLimit = stairPursuitActive ? this.stairVerticalAwareness : this.verticalAwareness;
        let sameFloor = verticalDist <= verticalLimit;

        const fullyUpperFloorCutoff = this.secondFloorY - this.floorTransitionBuffer;
        const fullyLowerFloorCutoff = this.secondFloorY + 40 + this.floorTransitionBuffer;
        const targetFullyUpperFloor = targetPos.y <= fullyUpperFloorCutoff;
        const enemyFullyUpperFloor = this.y <= fullyUpperFloorCutoff;
        const targetFullyLowerFloor = targetPos.y >= fullyLowerFloorCutoff;
        const enemyFullyLowerFloor = this.y >= fullyLowerFloorCutoff;

        if (!stairPursuitActive &&
            ((targetFullyUpperFloor && enemyFullyLowerFloor) ||
                (enemyFullyUpperFloor && targetFullyLowerFloor))) {
            sameFloor = false;
        }

        const canEngage = this.canEngagePlayer(player, {
            sameFloor,
            playerOnSlope: targetOnSlope,
            enemyOnSlope,
            horizontalDist,
            horizontalGap,
            verticalDist,
            centerDx,
            targetPos,
            canSeePlayer,
            targetNearFloorTransition,
            enemyNearFloorTransition,
            stairTransitionActive,
            stairPursuitActive
        });

        return {
            canSeePlayer,
            targetPos,
            centerDx,
            horizontalDist,
            horizontalGap,
            verticalDist,
            canEngage,
            targetReached: this.hasReachedTargetPosition(targetPos)
        };
    }

    finalizeUpdate(wasGrounded) {
        super.update();
        this.handleTileCollision();

        if (wasGrounded && !this.grounded) {
            this.wasFalling = true;
        }
        if (this.grounded) {
            this.wasFalling = false;
        }
    }

    onCollision(other) {
        // Handle collision with other entities
        console.log("Enemy collided with:", other.name);

    }

    isOnSlope(entity) {
        const tileMap = this.game.tileMap;
        if (!tileMap) return false;

        const feetY = entity.y + entity.height;
        const leftFootX = entity.x + 10;
        const rightFootX = entity.x + entity.width - 10;

        const leftTileX = Math.floor(leftFootX / tileMap.tileWidth);
        const leftTileY = Math.floor(feetY / tileMap.tileHeight);
        const rightTileX = Math.floor(rightFootX / tileMap.tileWidth);
        const rightTileY = Math.floor(feetY / tileMap.tileHeight);

        return !!(tileMap.getSlopeAt(leftTileX, leftTileY) || tileMap.getSlopeAt(rightTileX, rightTileY));
    }

    canEngagePlayer(player, context) {
        return context.sameFloor ||
            (context.stairPursuitActive && (context.canSeePlayer || this.hasSeenPlayer));
    }

    performAttack() {
        this.attackTimer = this.attackCooldown;

        const hitbox = new AttackHitbox(this, {
            layer: "enemy_attack",
            damage: this.damage,
            knockback: 120,
            size: {
                width: 24 * this.scale,
                height: 24 * this.scale
            },
            offset: {
                x: 4,
                y: 4
            }
        });

        if (typeof this.game.addEntity === "function") {
            this.game.addEntity(hitbox);
        }
        else if (Array.isArray(this.game.entities)) {
            this.game.entities.push(hitbox);
        }
        else if (this.game.gameEngine && Array.isArray(this.game.gameEngine.entities)) {
            this.game.gameEngine.entities.push(hitbox);
        }
        else {
            console.warn("Unable to add attack hitbox to the game.");
        }
    }

    takeDamage(amount) {
        if (this.state == "dead") {
            return;
        }

        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.onDeath();
        }
    }

    update() {

        const dt = this.game.clockTick || 0;
        if (this.state == "dead") {
            return;
        }
        const wasGrounded = this.grounded;

        this.attackTimer -= dt;
        this.attackDelayTimer -= dt;
        this.stairPursuitTimer = Math.max(0, this.stairPursuitTimer - dt);

        const player = this.findPlayer();
        if (!player) {
            this.finalizeUpdate(wasGrounded);
            return;
        }

        const {
            canSeePlayer,
            targetPos,
            centerDx,
            horizontalDist,
            horizontalGap,
            canEngage,
            targetReached
        } = this.getTargetContext(player);

        if (targetPos) {
            var faced = this.facing;
            this.facing = centerDx < 0 ? "left" : "right";
            if (this.facing !== faced) {
                this.animator.setDirection(this.facing);
            }
        }

        // If no viable target and haven't seen player, go idle
        if (!targetPos || !canEngage || (horizontalDist > this.aggroRange && !this.hasSeenPlayer)) {
            if (this.state !== "idle") {
                this.state = "idle";
                this.animator.setAnimation(this.idleAnimation, this.facing, true);
            }
            this.vx = 0;
        }
        else if (!canSeePlayer) {
            if (targetReached) {
                this.clearTargetMemory();
                if (this.state !== "idle") {
                    this.state = "idle";
                    this.animator.setAnimation(this.idleAnimation, this.facing, true);
                }
                this.vx = 0;
            } else {
                if (this.state !== "chase") {
                    this.state = "chase";
                    this.animator.setAnimation(this.chaseAnimation, this.facing, true);
                }

                let dir = 0;
                if (centerDx > this.horizontalDeadzone) dir = 1;
                else if (centerDx < -this.horizontalDeadzone) dir = -1;
                this.vx = dir * this.speed;
            }
        }
        else if (horizontalGap > this.attackRange) {
            // Chase towards target position (either player or last seen position)
            if (this.state !== "chase") {
                this.state = "chase";
                this.animator.setAnimation(this.chaseAnimation, this.facing, true);
            }
            
            let dir = 0;
            if (centerDx > this.horizontalDeadzone) dir = 1;
            else if (centerDx < -this.horizontalDeadzone) dir = -1;
            this.vx = dir * this.speed;
        }
        else {
            // In attack range
            if (this.state !== "waitingToAttack" && this.state !== "attacking") {
                this.state = "waitingToAttack";
                this.attackDelayTimer = this.attackDelay;
                this.animator.setAnimation(this.attackAnimation, this.facing, true);
            }
            this.vx = 0;

            // Handle attack delay and cooldown
            if (this.state === "waitingToAttack") {
                if (this.attackDelayTimer <= 0) {
                    this.state = "attacking";
                    this.performAttack();
                }
            }
            else if (this.state === "attacking") {
                if (this.attackTimer <= 0) {
                    this.performAttack();
                }
            }
        }

        this.finalizeUpdate(wasGrounded);
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

        // Check left wall with step-up
        if (tileMap.isSolidAtWorld(this.x, headY) ||
            tileMap.isSolidAtWorld(this.x, midY) ||
            tileMap.isSolidAtWorld(this.x, feetCheckY)) {
            let canStepUp = false;
            const maxStepHeight = 16;

            for (let step = 1; step <= maxStepHeight; step++) {
                const testY = this.y - step;
                if (!tileMap.isSolidAtWorld(this.x, testY + 10) &&
                    !tileMap.isSolidAtWorld(this.x, testY + this.height / 2) &&
                    !tileMap.isSolidAtWorld(this.x, testY + this.height - 10)) {
                    this.y = testY;
                    canStepUp = true;
                    break;
                }
            }

            if (!canStepUp) {
                const tileX = Math.floor(this.x / tileMap.tileWidth);
                this.x = (tileX + 1) * tileMap.tileWidth;
                this.vx = 0;
            }
        }

        // Check right wall with step-up
        const rightX = this.x + this.width;
        if (tileMap.isSolidAtWorld(rightX, headY) ||
            tileMap.isSolidAtWorld(rightX, midY) ||
            tileMap.isSolidAtWorld(rightX, feetCheckY)) {
            let canStepUp = false;
            const maxStepHeight = 16;

            for (let step = 1; step <= maxStepHeight; step++) {
                const testY = this.y - step;
                if (!tileMap.isSolidAtWorld(rightX, testY + 10) &&
                    !tileMap.isSolidAtWorld(rightX, testY + this.height / 2) &&
                    !tileMap.isSolidAtWorld(rightX, testY + this.height - 10)) {
                    this.y = testY;
                    canStepUp = true;
                    break;
                }
            }

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

        const leftTileX = Math.floor(leftFootX / tileMap.tileWidth);
        const leftTileY = Math.floor(feetY / tileMap.tileHeight);
        const rightTileX = Math.floor(rightFootX / tileMap.tileWidth);
        const rightTileY = Math.floor(feetY / tileMap.tileHeight);

        let onSlope = false;
        let slopeY = null;

        const leftSlope = tileMap.getSlopeAt(leftTileX, leftTileY);
        if (leftSlope) {
            const leftSlopeY = leftSlope.getYForX(leftFootX);
            if (feetY >= leftSlopeY - 4 && feetY <= leftSlopeY + 4) {
                slopeY = leftSlopeY;
                onSlope = true;
            }
        }

        const rightSlope = tileMap.getSlopeAt(rightTileX, rightTileY);
        if (rightSlope) {
            const rightSlopeY = rightSlope.getYForX(rightFootX);
            if (feetY >= rightSlopeY - 4 && feetY <= rightSlopeY + 4) {
                if (slopeY === null || rightSlopeY < slopeY) {
                    slopeY = rightSlopeY;
                }
                onSlope = true;
            }
        }

        if (onSlope && slopeY !== null && this.vy >= 0) {
            const distanceToSlope = feetY - slopeY;
            if (this.wasFalling && distanceToSlope < -8) {
                this.grounded = false;
            } else {
                this.y = slopeY - this.height;
                this.grounded = true;
                this.vy = 0;
            }
        } else {
            const leftGrounded = tileMap.isSolidAtWorld(leftFootX, feetY);
            const rightGrounded = tileMap.isSolidAtWorld(rightFootX, feetY);

            if ((leftGrounded || rightGrounded) && this.vy >= 0) {
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
    }
}

export default Enemy;
