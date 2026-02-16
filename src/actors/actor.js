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


        // Physics properties
        this.gravity = 800;  // Pixels per second squared
        this.terminalVelocity = 600;  // Max falling speed
        this.grounded = false;

        // Combat properties
        this.invulnerable = false;
        this.damageCooldown = 0.3;
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

        const dt = this.game.clockTick;

        if (this.damageCooldownTimer > 0) {
            this.damageCooldownTimer -= dt;
        }

        // Apply physics if not grounded
        if (!this.grounded) {
            this.vy += this.gravity * dt;

            // Terminal velocity
            if (this.vy > this.terminalVelocity) {
                this.vy = this.terminalVelocity;
            }
        }

        // Apply velocity to position
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Update animator
        if (this.animator) {
            this.animator.update(dt);
        }

        // Let state handle behavior
        if (this.currentState && this.currentState.do) {
            this.currentState.do(dt);
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
