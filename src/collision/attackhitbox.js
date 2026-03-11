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

        // Optional normalized direction vector {x, y} for 8-directional attacks.
        // If omitted, falls back to owner.facing (left/right).
        this.attackDir = options.attackDir || null;

        // Position offset from owner (e.g., in front of player)
        this.offsetX = options.offset?.x || 0;
        this.offsetY = options.offset?.y || 0;

        // Set up collider first so we can use its size
        this.collider = new Collider({
            size: options.size || { width: 32, height: 32 },
            layer: options.layer || "player_attack",
            isTrigger: true  // Pass-through, doesn't push entities
        });

        // Create slash animator for all attacks.
        // Directional attacks always use "right" facing so canvas rotation handles the direction.
        if (owner.animator && owner.game.assetManager) {
            this.animator = new Animator("ninja", owner.game.assetManager);
            this.animator.setScale(owner.scale || 3);
            const slashFacing = this.attackDir ? "right" : owner.facing;
            this.animator.setAnimation("attack_slash", slashFacing, false);

            // Disable bottom-alignment offset for slash - we want to position it manually
            // The ninja sprite has max height of 43px (airborne), slash is 27px
            // Without this, animator adds a 16px offset we don't want
            const maxHeight = this.animator.maxAnimationHeight * this.animator.scale;
            const slashHeight = 27 * this.animator.scale;
            this.animator.setVerticalAdjustment(-(maxHeight - slashHeight));
        }

        // Current position
        const pos = this._computePosition();
        this.x = pos.x;
        this.y = pos.y;

        // Track what we've already hit this attack (prevent multi-hit)
        this.hitEntities = new Set();

        // Lifetime timer (seconds)
        this.life = 0.4;

        this.removeFromWorld = false;
        this.name = "AttackHitbox";
    }

    /**
     * Compute hitbox top-left position based on attackDir or owner.facing.
     */
    _computePosition() {
        const owner = this.owner;
        const hw = this.collider.size.width / 2;
        const hh = this.collider.size.height / 2;

        if (this.attackDir) {
            // Place hitbox so its near face touches the player's edge in the attack direction
            const cx = owner.x + owner.width / 2;
            const cy = owner.y + owner.height / 2;
            return {
                x: cx + this.attackDir.x * (owner.width / 2 + hw) - hw,
                y: cy + this.attackDir.y * (owner.height / 2 + hh) - hh
            };
        }

        // Legacy: position based on facing direction
        return {
            x: owner.facing === "left"
                ? owner.x - this.collider.size.width - this.offsetX
                : owner.x + owner.width + this.offsetX,
            y: owner.y + this.offsetY
        };
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
        const pos = this._computePosition();
        this.x = pos.x;
        this.y = pos.y;

        // Update slash animation (horizontal attacks only)
        if (this.animator) {
            this.animator.update(dt);
            if (!this.attackDir) {
                this.animator.setDirection(this.owner.facing);
            }
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
            // Slash sprite dimensions: 124x27 at owner scale (ninja sprite)
            const slashWidth = 124 * this.owner.scale;
            const slashHeight = 27 * this.owner.scale;

            if (this.attackDir) {
                // Use player center as the rotation point (same as debug visualization)
                const cx = this.owner.x + this.owner.width / 2;
                const cy = this.owner.y + this.owner.height / 2;

                ctx.save();
                ctx.translate(cx, cy);

                if (this.attackDir.x < 0) {
                    // Left-facing: mirror on X then rotate by the reflected angle
                    // so the sprite stays right-side up
                    ctx.scale(-1, 1);
                    ctx.rotate(Math.atan2(this.attackDir.y, -this.attackDir.x));
                } else {
                    // Right-facing: just rotate
                    ctx.rotate(Math.atan2(this.attackDir.y, this.attackDir.x));
                }

                // Position sprite at distance from player center, centered vertically
                // Adjust -this.owner.width / 1.15 to move closer/farther
                const offsetX = -this.owner.width / 1.15;
                const offsetY = -slashHeight / 2;  // Center vertically

                this.animator.draw(ctx, offsetX, offsetY);
                ctx.restore();
            } else {
                // Legacy left/right: align sprite's near edge with player's near edge
                const slashY = this.owner.y;
                const slashX = this.owner.facing === "left"
                    ? this.owner.x + this.owner.width - slashWidth
                    : this.owner.x;
                this.animator.draw(ctx, slashX, slashY);
            }
        }

        // Draw attack hitbox when toggle is enabled
        if (game.showHitboxes) {
            ctx.save();
            ctx.strokeStyle = "#ff0000";  // Red for attack hitbox
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            ctx.strokeRect(
                this.x,
                this.y,
                this.collider.size.width,
                this.collider.size.height
            );

            // Draw center point
            ctx.fillStyle = "#ff0000";
            ctx.beginPath();
            ctx.arc(
                this.x + this.collider.size.width / 2,
                this.y + this.collider.size.height / 2,
                3, 0, Math.PI * 2
            );
            ctx.fill();

            ctx.restore();
        }
    }
}

export default AttackHitbox;
