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
        this.hitbox = new AttackHitbox(this.myEntity, {
            offset: { x: 32, y: -20},  // In front of player, offset up to center
            size: { width: 82 * 3, height: 20 * 3 },  // Taller to hit enemies above/below
            damage: 25,
            knockback: 150,
            layer: "player_attack"
        });

        this.myEntity.game.addEntity(this.hitbox);
    }

    do(dt) {
        this.attackTimer += dt;

        // End attack after duration
        if (this.attackTimer >= this.attackDuration) {
            this.myEntity.changeState("idle");
        }
    }

    exit() {
        // Remove the hitbox when attack ends
        if (this.hitbox) {
            this.hitbox.removeFromWorld = true;
            this.hitbox = null;
        }

        // Return to idle animation
        if (this.myEntity.animator) {
            this.myEntity.animator.setAnimation("idle", this.myEntity.facing, true);
            this.myEntity.currentAnimState = "idle";
        }
    }
}

export default Attack;
