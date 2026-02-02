import Collider from "../collision/collider.js";

// Base Actor class
class Actor {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = 32;
        this.height = 32;
        this.states = {};
        this.currentState = null;
        this.speed = 100;
        this.health = 50; // changed for enemy testing
        this.name = "Actor";
        this.animator = null;
        this.collider = null;
        this.damageCooldown = 0.2; // seconds of invincibility after taking damage
        this.damageCooldownTimer = 0;
    }

    /**
     * Set up a collider for this actor
     * @param {Object} options - Collider options {offset, size, type, layer, isTrigger}
     */
    setCollider(options = {}) {
        // Default size to actor's width/height
        const defaults = {
            size: { width: this.width, height: this.height }
        };
        this.collider = new Collider({ ...defaults, ...options });
    }

    initialize() {
        // Stub for initialization logic
    }

    onCollision(other) {
        // Stub for collision logic
    }

    takeDamage(amount) {
        // Only take damage if cooldown has expired
        if (this.damageCooldownTimer <= 0) {
            this.health -= amount;
            this.damageCooldownTimer = this.damageCooldown; // Start cooldown

            if (this.health <= 0) {
                this.health = 0;
                this.onDeath();
            }
        }
    }

    onDeath() {
        // Stub for death logic - override in subclasses
        this.removeFromWorld = true;
    }

    addState(name, state) {
        this.states[name] = state;
        state.myEntity = this;
    }

    changeState(name) {
        if (this.currentState && this.currentState.exit) {
            this.currentState.exit();
        }
        this.currentState = this.states[name] || null;
        if (this.currentState && this.currentState.enter) {
            this.currentState.enter();
        }
    }

    update() {
        // Update damage cooldown timer
        if (this.damageCooldownTimer > 0) {
            this.damageCooldownTimer -= this.game.clockTick;
        }

        if (this.currentState && this.currentState.do) {
            this.currentState.do(this.game.clockTick);
        }
    }

    draw(ctx, game) {

        ctx.save();
        ctx.fillStyle = "#888";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = "#000";
        ctx.fillText(this.name, this.x + 2, this.y + 16);
        ctx.restore();
    }
}

export default Actor;
