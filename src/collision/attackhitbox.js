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
        const layer = options.layer || "player_attack";
        this.collider = new Collider({
            size: options.size || { width: 32, height: 32 },
            layer,
            isTrigger: true,  // Pass-through, doesn't push entities
            angle: options.attackDir ? Math.atan2(options.attackDir.y, options.attackDir.x) : 0
        });

        // Create slash animator only if owner is in dream state
        // Directional attacks always use "right" facing so canvas rotation handles the direction.
        if (owner.inDreamState && owner.animator && owner.game.assetManager) {
            this.animator = new Animator("ninja", owner.game.assetManager);
            this.animator.setScale((owner.scale || 3) * 0.7);
            const slashFacing = this.attackDir ? "right" : owner.facing;
            this.animator.setAnimation("attack_slash", slashFacing, false);

            // Disable bottom-alignment offset for slash - we want to position it manually
            // The ninja sprite has max height of 43px (airborne), slash is 27px
            // Without this, animator adds a 16px offset we don't want
            const maxHeight = this.animator.maxAnimationHeight * this.animator.scale;
            const slashHeight = 27 * this.animator.scale;
            this.animator.setVerticalAdjustment(-(maxHeight - slashHeight));
        } else {
            this.animator = null;
        this.visualEffect = this.resolveVisualEffect(options.visualEffect, layer);

        // Optional attack visual effect.
        if (this.visualEffect && owner.animator && owner.game.assetManager) {
            this.animator = new Animator(this.visualEffect.spriteName, owner.game.assetManager);
            this.animator.setScale(this.visualEffect.scale ?? (owner.scale || 3) * 0.7);
            const effectFacing = this.attackDir
                ? (this.visualEffect.attackDirFacing ?? "right")
                : owner.facing;
            this.animator.setAnimation(
                this.visualEffect.animationName,
                effectFacing,
                this.visualEffect.loop ?? false
            );

            if (this.visualEffect.disableBottomAlignment) {
                const maxHeight = this.animator.maxAnimationHeight * this.animator.scale;
                const effectHeight = this.animator.getCurrentFrameTransform().h * this.animator.scale;
                this.animator.setVerticalAdjustment(-(maxHeight - effectHeight));
            }
        }

        // Current position
        const pos = this._computePosition();
        this.x = pos.x;
        this.y = pos.y;

        // Track what we've already hit this attack (prevent multi-hit)
        this.hitEntities = new Set();

        // Lifetime timer (seconds)
        this.life = options.life ?? this.visualEffect?.life ?? 0.4;

        this.removeFromWorld = false;
        this.name = "AttackHitbox";
    }

    resolveVisualEffect(visualEffect, layer) {
        if (visualEffect === false) {
            return null;
        }

        if (visualEffect) {
            return visualEffect;
        }

        if (layer !== "player_attack") {
            return null;
        }

        return {
            spriteName: "ninja",
            animationName: "attack_slash",
            scale: (this.owner.scale || 3) * 0.7,
            loop: false,
            disableBottomAlignment: true,
            positionMode: this.attackDir ? "attackDir" : "legacyHorizontal",
            baseWidth: 124,
            baseHeight: 27
        };
    }

    getVisualEffectSize() {
        if (!this.animator) {
            return { width: 0, height: 0 };
        }

        const transform = this.animator.getCurrentFrameTransform();
        return {
            width: transform.w * this.animator.scale,
            height: transform.h * this.animator.scale
        };
    }

    getVisualEffectDrawPosition(effectWidth, effectHeight) {
        const effect = this.visualEffect || {};
        const facingSign = this.owner.facing === "left" ? -1 : 1;
        const offsetX = (effect.offsetX ?? 0) * facingSign;
        const offsetY = effect.offsetY ?? 0;

        if (effect.positionMode === "frontCenter") {
            const forwardOffset = (effect.forwardOffset ?? 0) * facingSign;
            return {
                x: this.owner.x + (this.owner.width / 2) + forwardOffset + offsetX - (effectWidth / 2),
                y: this.owner.y + (this.owner.height / 2) - (effectHeight / 2) + offsetY
            };
        }

        if (effect.positionMode === "bottomCenter") {
            return {
                x: this.owner.x + (this.owner.width / 2) + offsetX - (effectWidth / 2),
                y: this.owner.y + this.owner.height - effectHeight + offsetY
            };
        }

        return {
            x: this.owner.facing === "left"
                ? this.owner.x + this.owner.width - effectWidth + offsetX
                : this.owner.x + offsetX,
            y: this.owner.y + offsetY
        };
    }

    /**
     * Compute hitbox top-left position based on attackDir or owner.facing.
     */
    _computePosition() {
        const owner = this.owner;
        const hw = this.collider.size.width / 2;
        const hh = this.collider.size.height / 2;

        if (this.attackDir) {
            // Center hitbox at the slash visual center (same math as draw offsetX)
            const cx = owner.x + owner.width / 2;
            const cy = owner.y + owner.height / 2;
            const slashW = this.visualEffect?.baseWidth && this.animator
                ? this.visualEffect.baseWidth * this.animator.scale
                : this.collider.size.width;
            const slashCenter = -owner.width * 0.75 + slashW / 2;
            return {
                x: cx + this.attackDir.x * slashCenter - hw,
                y: cy + this.attackDir.y * slashCenter - hh
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
            const { width: slashWidth, height: slashHeight } = this.getVisualEffectSize();

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
                const offsetX = this.visualEffect?.offsetX ?? -this.owner.width * 0.75;
                const offsetY = this.visualEffect?.offsetY ?? -(slashHeight / 2);

                this.animator.draw(ctx, offsetX, offsetY);
                ctx.restore();
            } else {
                const drawPosition = this.getVisualEffectDrawPosition(slashWidth, slashHeight);
                const slashX = drawPosition.x;
                const slashY = drawPosition.y;
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

            // Draw slash direction and length indicator
            if (this.attackDir) {
                const cx = this.owner.x + this.owner.width / 2;
                const cy = this.owner.y + this.owner.height / 2;
                const slashLength = this.animator ? 124 * this.animator.scale : 100;

                // Draw line from player center in attack direction
                ctx.strokeStyle = "#00ff00";  // Green for slash direction
                ctx.lineWidth = 3;
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(
                    cx + this.attackDir.x * slashLength,
                    cy + this.attackDir.y * slashLength
                );
                ctx.stroke();

                // Draw endpoint circle
                ctx.fillStyle = "#00ff00";
                ctx.beginPath();
                ctx.arc(
                    cx + this.attackDir.x * slashLength,
                    cy + this.attackDir.y * slashLength,
                    5, 0, Math.PI * 2
                );
                ctx.fill();

                // Draw slash width indicator
                ctx.strokeStyle = "#ffff00";  // Yellow for slash width
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.5;
                const slashWidth = this.animator ? 27 * this.animator.scale : 30;
                const perpX = -this.attackDir.y;
                const perpY = this.attackDir.x;

                ctx.beginPath();
                ctx.moveTo(
                    cx + perpX * slashWidth / 2,
                    cy + perpY * slashWidth / 2
                );
                ctx.lineTo(
                    cx - perpX * slashWidth / 2,
                    cy - perpY * slashWidth / 2
                );
                ctx.stroke();
            }

            ctx.restore();
        }
    }
}

export default AttackHitbox;
