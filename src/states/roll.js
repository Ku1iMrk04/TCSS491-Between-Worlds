
import State from "./state.js";

class Roll extends State {
    constructor() {
        super();
        this.rollDuration = 0.4;  // Roll lasts 0.4 seconds
        this.rollSpeed = 300;  // Roll movement speed
        this.timeRemaining = 0;
    }

    enter() {
        const entity = this.myEntity;

        // Phase through enemies during roll
        entity.collider.layer = "player_rolling";

        // Set roll duration
        this.timeRemaining = this.rollDuration;

        // Apply roll velocity based on facing direction
        if (entity.facing === "left") {
            entity.vx = -this.rollSpeed;
        } else {
            entity.vx = this.rollSpeed;
        }

        // Keep grounded during roll
        entity.grounded = true;
        entity.vy = 0;

        // Set roll animation (non-looping)
        // Will use fallback NoSpriteBudda.png until roll animation is added to zero.json
        if (entity.animator) {
            entity.animator.setAnimation("roll", entity.facing, false);
        }
    }

    do(dt) {
        const entity = this.myEntity;

        // Countdown timer
        this.timeRemaining -= dt;

        // Maintain roll velocity
        if (entity.facing === "left") {
            entity.vx = -this.rollSpeed;
        } else {
            entity.vx = this.rollSpeed;
        }

        // End roll when time is up
        if (this.timeRemaining <= 0) {
            entity.changeState("idle");
        }
    }

    exit() {
        const entity = this.myEntity;

        // Restore normal collision layer
        entity.collider.layer = "player";

        // Stop horizontal movement
        entity.vx = 0;
    }
}

export default Roll;
