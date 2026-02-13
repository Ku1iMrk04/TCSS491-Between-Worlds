
import State from "./state.js";

class Fall extends State {
    enter() {
        const entity = this.myEntity;

        // Set fall animation
        if (entity.animator) {
            entity.animator.setAnimation("fall", entity.facing, true);
        }
    }

    do(dt) {
        const entity = this.myEntity;
        const game = entity.game;

        // Store previous facing to detect direction changes
        const previousFacing = entity.facing;

        // Air control - horizontal movement while falling
        if (game.left) {
            entity.vx = -entity.speed;
            entity.facing = "left";
        } else if (game.right) {
            entity.vx = entity.speed;
            entity.facing = "right";
        } else {
            // Reduce horizontal velocity in air (air friction)
            entity.vx *= 0.9;
        }

        // Update animator direction if facing changed
        if (entity.animator && previousFacing !== entity.facing) {
            entity.animator.setDirection(entity.facing);
        }

        // If grounded, transition back to idle or run
        if (entity.grounded) {
            if (game.left || game.right) {
                entity.changeState("run");
            } else {
                entity.changeState("idle");
            }
        }
    }

    exit() {
        // Reset vertical velocity when landing
        if (this.myEntity.grounded) {
            this.myEntity.vy = 0;
        }
    }
}

export default Fall;