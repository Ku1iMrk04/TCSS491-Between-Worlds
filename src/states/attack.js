import State from "./state.js";
import AttackHitbox from "../collision/attackhitbox.js";

class Attack extends State {
    constructor() {
        super();
        this.hitbox = null;
        this.attackDuration = 0.22; // How long the attack lasts (seconds)
        this.attackTimer = 0;
        this.dashSpeed = 380;   // Peak lunge speed at start of attack
        this.lungeDuration = 0.15;  // How long the lunge deceleration lasts
        this.attackDirX = 1;
        this.attackDirY = 0;
    }

    enter() {
        this.attackTimer = 0;

        const entity = this.myEntity;
        const game = entity.game;

        // Use direction captured at click-time for zero-lag responsiveness.
        // Falls back to current input if not pre-captured.
        let dx, dy;
        if (entity.pendingAttackDirX !== undefined) {
            dx = entity.pendingAttackDirX;
            dy = entity.pendingAttackDirY;
            entity.pendingAttackDirX = undefined;
            entity.pendingAttackDirY = undefined;
        } else {
            dx = 0; dy = 0;
            if (game.left) dx = -1;
            else if (game.right) dx = 1;
            if (game.up) dy = -1;
            else if (game.down) dy = 1;
            if (dx === 0 && dy === 0) {
                if (!entity.grounded && entity.vy > 0) dy = 1;
                else dx = entity.facing === "left" ? -1 : 1;
            }
        }

        // Normalize diagonal so speed is consistent
        if (dx !== 0 && dy !== 0) {
            const len = Math.SQRT2;
            dx /= len;
            dy /= len;
        }

        this.attackDirX = dx;
        this.attackDirY = dy;

        // Update facing based on horizontal component
        if (dx < 0) entity.facing = "left";
        else if (dx > 0) entity.facing = "right";

        // Play sword swing sound effect
        if (game.soundManager) game.soundManager.playSfx("swordMiss");

        // Set attack animation at faster speed
        if (entity.animator) {
            entity.animator.setAnimation("attack", entity.facing, false);
            entity.animator.setSpeed(0.06);
        }

        // Size hitbox to match slash visual (124x27 sprite at scale * 0.7)
        const slashScale = entity.scale * 0.7;
        const slashW = Math.round(124 * slashScale);
        const slashH = Math.round(27 * slashScale);
        const isVertical = Math.abs(dy) > Math.abs(dx);
        const hitboxSize = isVertical
            ? { width: slashH, height: slashW }
            : { width: slashW, height: slashH };

        // Spawn hitbox in the attack direction
        try {
            this.hitbox = new AttackHitbox(entity, {
                attackDir: { x: this.attackDirX, y: this.attackDirY },
                size: hitboxSize,
                damage: 25,
                knockback: 150,
                layer: "player_attack"
            });

            if (this.myEntity.game && this.myEntity.game.addEntity) {
                this.myEntity.game.addEntity(this.hitbox);
            }
        } catch (err) {
            console.error("Error creating attack hitbox:", err);
            this.hitbox = null;
        }
    }

    do(dt) {
        const entity = this.myEntity;
        const game = entity.game;

        this.attackTimer += dt;

        const lungeProgress = Math.min(this.attackTimer / this.lungeDuration, 1.0);

        if (lungeProgress < 1.0) {
            // Smoothly decelerate from dashSpeed to 0 over the lunge window
            const speed = this.dashSpeed * (1 - lungeProgress);
            entity.vx = this.attackDirX * speed;
            // Don't lunge downward into the ground
            entity.vy = (this.attackDirY > 0 && entity.grounded) ? 0 : this.attackDirY * speed;
        } else {
            // Lunge finished — restore normal movement input
            const previousFacing = entity.facing;

            if (game.left) {
                entity.vx = -entity.speed;
                entity.facing = "left";
            } else if (game.right) {
                entity.vx = entity.speed;
                entity.facing = "right";
            } else {
                entity.vx = 0;
            }

            if (entity.animator && previousFacing !== entity.facing) {
                entity.animator.setDirection(entity.facing);
            }
        }

        // End attack after duration
        if (this.attackTimer >= this.attackDuration) {
            if (game.left || game.right) {
                entity.changeState("run");
            } else {
                entity.changeState("idle");
            }
        }
    }

    exit() {
        // Remove the hitbox when attack ends
        if (this.hitbox) {
            try {
                this.hitbox.removeFromWorld = true;
            } catch (err) {
                console.error("Error removing attack hitbox:", err);
            }
            this.hitbox = null;
        }

        // Return to idle animation and restore default speed
        if (this.myEntity && this.myEntity.animator) {
            try {
                this.myEntity.animator.setSpeed(0.1);
                this.myEntity.animator.setAnimation("idle", this.myEntity.facing, true);
                this.myEntity.currentAnimState = "idle";
            } catch (err) {
                console.error("Error resetting animation after attack:", err);
            }
        }
    }
}

export default Attack;
