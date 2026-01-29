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

        // Spawn hitbox in front of the player (centered vertically, extends above/below)
        this.hitbox = new AttackHitbox(this.myEntity, {
            offset: { x: 32, y: -16 },  // In front of player, offset up to center
            size: { width: 40, height: 64 },  // Taller to hit enemies above/below
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
    }
}

export default Attack;
