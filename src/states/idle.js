
import State from "./state.js";

class Idle extends State {
    enter() {
        // Stop horizontal movement
        this.myEntity.vx = 0;
    }

    do(dt) {
        const entity = this.myEntity;
        const game = entity.game;

        // Keep entity stationary
        entity.vx = 0;

        // If movement input detected, transition to run
        if (game.left || game.right) {
            entity.changeState("run");
        }
    }

    exit() {
        // Cleanup if needed
    }
}

export default Idle;
