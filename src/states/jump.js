
import State from "./state.js";

class Jump extends State {
    enter() {
        const entity = this.myEntity;

        // Apply initial jump velocity (negative = upward)
        entity.vy = -400;  // Jump strength
        entity.grounded = false;
    }

    do(dt) {
        const entity = this.myEntity;
        const game = entity.game;

        // Air control - horizontal movement while jumping
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

export default Jump;
