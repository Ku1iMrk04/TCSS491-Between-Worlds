
import State from "./state.js";

class Run extends State {
    enter() {
        // Set run animation
        if (this.myEntity.animator) {
            this.myEntity.animator.setAnimation("run", this.myEntity.facing, true);
        }
    }

    do(dt) {
        const entity = this.myEntity;
        const game = entity.game;

        // Store previous facing to detect direction changes
        const previousFacing = entity.facing;

        // Horizontal movement
        if (game.left) {
            entity.vx = -entity.speed;
            entity.facing = "left";
        } else if (game.right) {
            entity.vx = entity.speed;
            entity.facing = "right";
        } else {
            // No input - apply friction/stop
            entity.vx = 0;
        }

        // Update animator direction if facing changed
        if (entity.animator && previousFacing !== entity.facing) {
            entity.animator.setDirection(entity.facing);
        }

        // If no horizontal input, transition back to idle
        if (!game.left && !game.right) {
            entity.changeState("idle");
        }
    }

    exit() {
        // Stop horizontal movement when exiting
        this.myEntity.vx = 0;
    }
}

export default Run;
