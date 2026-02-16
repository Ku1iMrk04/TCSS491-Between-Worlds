
import State from "./state.js";

class Jump extends State {
    enter() {
        const entity = this.myEntity;

        // Apply initial jump velocity (negative = upward)
        entity.vy = -550;  // Jump strength
        entity.grounded = false;

        // Set jump animation (non-looping)
        // Will use fallback or idle animation until jump animation is added to zero.json
        if (entity.animator) {
            try {
                // Try to set jump animation, but use idle if it doesn't exist
                if (entity.animator.spriteAtlas && entity.animator.spriteAtlas.hasAnimation("jump")) {
                    entity.animator.setAnimation("jump", entity.facing, false);
                } else {
                    // Use idle animation as fallback for jumping
                    entity.animator.setAnimation("idle", entity.facing, true);
                }
            } catch (err) {
                console.error("Error setting jump animation:", err);
            }
        }
    }

    do(dt) {
        const entity = this.myEntity;
        const game = entity.game;

        // Store previous facing to detect direction changes
        const previousFacing = entity.facing;

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
        if (this.myEntity && this.myEntity.grounded) {
            this.myEntity.vy = 0;
        }
    }
}

export default Jump;
