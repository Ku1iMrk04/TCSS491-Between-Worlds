import State from "./state.js";
import AttackHitbox from "../collision/attackhitbox.js";

class Attack extends State {
    constructor() {
        super();
        this.hitbox = null;
        this.attackDuration = 0.3;  // How long the attack lasts (seconds)
        this.attackTimer = 0;
    }

    enter() {
        this.attackTimer = 0;

        // Set attack animation
        if (this.myEntity.animator) {
            this.myEntity.animator.setAnimation("attack", this.myEntity.facing, false);
        }

        // Spawn hitbox in front of the player (centered vertically, extends above/below)
        try {
            this.hitbox = new AttackHitbox(this.myEntity, {
                offset: { x: 32, y: -20},  // In front of player, offset up to center
                size: { width: 82 * 3, height: 20 * 3 },  // Taller to hit enemies above/below
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

        // Store previous facing to detect direction changes
        const previousFacing = entity.facing;

        // Allow movement while attacking
        if (game.left) {
            entity.vx = -entity.speed;
            entity.facing = "left";
        } else if (game.right) {
            entity.vx = entity.speed;
            entity.facing = "right";
        } else {
            entity.vx = 0;
        }

        // Update animator direction if facing changed
        if (entity.animator && previousFacing !== entity.facing) {
            entity.animator.setDirection(entity.facing);
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
