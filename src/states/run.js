
import State from "./state.js";

class Run extends State {
    enter() {
        // Reset horizontal velocity on enter
        this.myEntity.vx = 0;
    }

    do(dt) {
        const entity = this.myEntity;
        const game = entity.game;

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
