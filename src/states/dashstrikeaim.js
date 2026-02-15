
import State from "./state.js";

class DashStrikeAim extends State {
    constructor() {
        super();
        this.barSpeed = 0.67;       // fills in ~1.5s (1/1.5)
        this.barProgress = 0;       // 0 to 1
        this.sweetSpotStart = 0.70;
        this.sweetSpotEnd = 0.80;
    }

    enter() {
        const entity = this.myEntity;

        // Slow-mo
        entity.game.timeScale = 0.5;

        // Reset bar
        this.barProgress = 0;

        // Clear any pending release from a quick click so it doesn't
        // immediately fizzle on the first frame
        entity.game.rightMouseReleased = false;

        // Freeze player movement
        entity.vx = 0;
    }

    do(dt) {
        const entity = this.myEntity;
        const game = entity.game;

        // Advance bar using real time (not slowed)
        this.barProgress += game.rawClockTick * this.barSpeed;

        // Keep player frozen
        entity.vx = 0;

        // Check for release
        if (game.rightMouseReleased) {
            game.rightMouseReleased = false;

            if (this.barProgress >= this.sweetSpotStart && this.barProgress <= this.sweetSpotEnd) {
                // Success - dash executes
                entity.changeState("dashstrike");
            } else {
                // Miss - fizzle
                entity.changeState("idle");
            }
            return;
        }

        // Bar filled completely - auto fail
        if (this.barProgress >= 1.0) {
            this.barProgress = 1.0;
            entity.changeState("idle");
        }
    }

    exit() {
        // Restore normal speed
        this.myEntity.game.timeScale = 1;
    }
}

export default DashStrikeAim;
