import Collider from "./collider.js";

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

        // Current position (account for facing direction)
        this.y = owner.y + this.offsetY;
        if (owner.facing === "left") {
            this.x = owner.x - this.collider.size.width;
        } else {
            this.x = owner.x + owner.width;
        }

        // Track what we've already hit this attack (prevent multi-hit)
        this.hitEntities = new Set();

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
        // Follow the owner's position
        this.y = this.owner.y + this.offsetY;

        // Position hitbox based on facing direction
        if (this.owner.facing === "left") {
            this.x = this.owner.x - this.collider.size.width;
        } else {
            this.x = this.owner.x + this.owner.width;
        }
    }

    draw(ctx, game) {
        // Always draw for now to debug
        ctx.save();
        ctx.strokeStyle = "red";
        ctx.lineWidth = 3;
        ctx.strokeRect(
            this.x,
            this.y,
            this.collider.size.width,
            this.collider.size.height
        );
        ctx.restore();
    }
}

export default AttackHitbox;
