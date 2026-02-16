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
            this.x = owner.x - this.collider.size.width - this.offsetX;
        } else {
            this.x = owner.x + owner.width + this.offsetX;
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
            this.x = this.owner.x - this.collider.size.width - this.offsetX;
        } else {
            this.x = this.owner.x + this.owner.width + this.offsetX;
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
            let slashX, slashY;

            // Get the attack slash sprite dimensions (88x28 at scale)
            const slashWidth = 88 * this.owner.scale;

            // Align attack sprite's top corner with player's top corner
            slashY = this.owner.y; // Top aligned with player

            if (this.owner.facing === "left") {
                // Attack sprite's top-RIGHT corner aligns with player's top-RIGHT corner
                // Player's right edge is at: owner.x + owner.width
                // Attack sprite's right edge should be at same position
                // So left edge is at: (owner.x + owner.width) - slashWidth
                slashX = this.owner.x + this.owner.width - slashWidth;
            } else {
                // Attack sprite's top-LEFT corner aligns with player's top-LEFT corner
                slashX = this.owner.x;
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
