import Collider from "./collider.js";
import Animator from "../animation/animator.js";

/**
 * A temporary hitbox spawned during attacks.
 * Follows the owner and triggers collision callbacks.
 */
class AttackHitbox {
    constructor(owner, options = {}) {
        this.owner = owner;
        this.game = owner.game;

        // Attack properties
        this.damage = options.damage || 10;
        this.knockback = options.knockback || 100;

        // Position offset from owner (e.g., in front of player)
        this.offsetX = options.offset?.x || 0;
        this.offsetY = options.offset?.y || 0;

        // Set up collider first so we can use its size
        this.collider = new Collider({
            size: options.size || { width: 32, height: 32 },
            layer: options.layer || "player_attack",
            isTrigger: true  // Pass-through, doesn't push entities
        });

        // Create animator for attack slash visual effect
        if (owner.animator && owner.game.assetManager) {
            this.animator = new Animator("zero", owner.game.assetManager);
            this.animator.setScale(owner.scale || 3);
            this.animator.setAnimation("attack_slash", owner.facing, false);
        }

        // Current position (account for facing direction)
        this.y = owner.y + this.offsetY;
        if (owner.facing === "left") {
            this.x = owner.x - this.collider.size.width;
        } else {
            this.x = owner.x + owner.width;
        }

        // Track what we've already hit this attack (prevent multi-hit)
        this.hitEntities = new Set();

        // Lifetime timer (seconds)
        this.life = 0.15;

        this.removeFromWorld = false;
        this.name = "AttackHitbox";
    }

    /**
     * Check if this hitbox has already hit an entity
     */
    hasHit(entity) {
        return this.hitEntities.has(entity);
    }

    /**
     * Mark an entity as hit by this attack
     */
    markHit(entity) {
        this.hitEntities.add(entity);
    }

    update() {
        const dt = this.game.clockTick;

        // Follow the owner's position
        this.y = this.owner.y + this.offsetY;

        // Position hitbox based on facing direction
        if (this.owner.facing === "left") {
            this.x = this.owner.x - this.collider.size.width;
        } else {
            this.x = this.owner.x + this.owner.width;
        }

        // Update slash animation
        if (this.animator) {
            this.animator.update(dt);
            // Update direction if owner changes facing mid-attack
            this.animator.setDirection(this.owner.facing);
        }

        // Lifetime logic
        this.life -= dt;
        if (this.life <= 0) {
            this.removeFromWorld = true;
        }
    }

    draw(ctx, game) {
        // Draw the attack slash animation
        if (this.animator) {
            // Position slash to match hitbox position
            let slashX = this.x;
            const slashY = this.owner.y; // Keep vertically aligned with player

            // When facing left, shift 96 pixels to the right
            // When facing right, position normally
            if (this.owner.facing === "left") {
                slashX += 64;  // Add to move right
            }

            this.animator.draw(ctx, slashX, slashY);
        }

        // Draw hitbox in debug mode
        if (game.debugging) {
            ctx.save();
            ctx.strokeStyle = "red";
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.5;
            ctx.strokeRect(
                this.x,
                this.y,
                this.collider.size.width,
                this.collider.size.height
            );
            ctx.restore();
        }
    }
}

export default AttackHitbox;
