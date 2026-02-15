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

        this.state = "idle";  // Possible states: idle, patrol, chase, attack
        this.aggroRange = 420;
        this.attackRange = 40;
        this.verticalAwareness = 80; // Detect/chase targets on the same floor with a bit more tolerance
        this.stairVerticalAwareness = 320; // Keep chase active through taller stair height differences
        this.secondFloorY = 240; // Map-specific upper floor cutoff (smaller Y = higher on map)
        this.horizontalDeadzone = 6; // Prevent jitter when target is almost perfectly aligned in X
        this.speed = 30;

        // attack timing
        this.attackCooldown = 0.9; // seconds
        this.attackTimer = 0;

        // facing hitbox placement
        this.facing = "left";
        this.animator = new Animator("enemy_scientist", this.game.assetManager);
        this.animator.setScale(this.scale);
        this.idleAnimation = "idle";
        this.chaseAnimation = "walk";
        this.attackAnimation = "idle";
        this.player = null;
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
        return context.sameFloor;
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

        const player = this.findPlayer();
        if (!player) {
            super.update();
            return;
        }

        const playerCenterX = player.x + (player.width / 2);
        const enemyCenterX = this.x + (this.width / 2);
        const centerDx = playerCenterX - enemyCenterX;
        const dy = player.y - this.y;
        const horizontalDist = Math.abs(centerDx);
        const horizontalGap = Math.max(
            0,
            Math.max(
                player.x - (this.x + this.width),
                this.x - (player.x + player.width)
            )
        );
        const verticalDist = Math.abs(dy);
        const playerOnSlope = this.isOnSlope(player);
        const enemyOnSlope = this.isOnSlope(this);
        const verticalLimit = (playerOnSlope || enemyOnSlope) ? this.stairVerticalAwareness : this.verticalAwareness;
        let sameFloor = verticalDist <= verticalLimit;

        // If player is fully on upper floor and enemy is still below, stop aggro.
        // Do not block aggro while player/enemy is still transitioning on stairs.
        if (!playerOnSlope && !enemyOnSlope &&
            player.y <= this.secondFloorY && this.y > this.secondFloorY + 40) {
            sameFloor = false;
        }
        const canEngage = this.canEngagePlayer(player, {
            sameFloor,
            playerOnSlope,
            enemyOnSlope,
            horizontalDist,
            horizontalGap,
            verticalDist,
            centerDx
        });

        var faced = this.facing;
        this.facing = centerDx < 0 ? "left" : "right";
        if (this.facing !== faced) {
            this.animator.setDirection(this.facing);
        }

        if (!canEngage || horizontalDist > this.aggroRange) {
            if (this.state !== "idle") {
                this.state = "idle";
                this.animator.setAnimation(this.idleAnimation, this.facing, true);
            }
            this.vx = 0;
        }
        else if (horizontalGap > this.attackRange) {
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
            if (this.state !== "attack") {
                this.state = "attack";
                this.animator.setAnimation(this.attackAnimation, this.facing, true);
            }
            this.vx = 0;
            if (this.attackTimer <= 0) {
                this.performAttack();
            }
        }

        // Apply physics
        super.update();

        // Tilemap collision detection AFTER physics
        this.handleTileCollision();

        if (wasGrounded && !this.grounded) {
            this.wasFalling = true;
        }
        if (this.grounded) {
            this.wasFalling = false;
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
