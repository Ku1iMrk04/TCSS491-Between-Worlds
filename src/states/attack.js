import State from "./state.js";
import AttackHitbox from "../collision/attackhitbox.js";

class Attack extends State {
    constructor() {
        super();
        this.hitbox = null;
        this.attackDuration = 0.3;  // How long the attack lasts (seconds)
        this.attackTimer = 0;
        this.dashSpeed = 800;   // Peak lunge speed at start of attack
        this.lungeDuration = 0.15;  // How long the lunge deceleration lasts
        this.attackDirX = 1;
        this.attackDirY = 0;
    }

    enter() {
        this.attackTimer = 0;

        const entity = this.myEntity;
        const game = entity.game;

        // Compute attack direction from current input (8-directional)
        let dx = 0, dy = 0;
        if (game.left) dx = -1;
        else if (game.right) dx = 1;
        if (game.up) dy = -1;
        else if (game.down) dy = 1;

        // Default to facing direction if no directional input
        if (dx === 0 && dy === 0) {
            dx = entity.facing === "left" ? -1 : 1;
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

        // Set attack animation
        if (entity.animator) {
            entity.animator.setAnimation("attack", entity.facing, false);
        }

        // Size hitbox based on primary attack axis
        const isVertical = Math.abs(dy) > Math.abs(dx);
        const hitboxSize = isVertical
            ? { width: 20 * 3, height: 82 * 3 }   // tall for up/down
            : { width: 82 * 3, height: 20 * 3 };   // wide for left/right/diagonal

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
            entity.vy = this.attackDirY * speed;
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

        // Return to idle animation
        if (this.myEntity && this.myEntity.animator) {
            try {
                this.myEntity.animator.setAnimation("idle", this.myEntity.facing, true);
                this.myEntity.currentAnimState = "idle";
            } catch (err) {
                console.error("Error resetting animation after attack:", err);
            }
        }
    }
}

export default Attack;
