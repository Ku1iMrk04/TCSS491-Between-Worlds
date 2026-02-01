import Actor from "./actor.js";
import AttackHitbox from "../collision/attackhitbox.js";    

class Enemy extends Actor {
    constructor(game, x, y) {
        super(game, x, y);
        this.ai = null;
        this.name = "Enemy";
        this.setCollider({ layer: "enemy" });

        this.health = 40;
        this.contactDamage = 10;
        this.damage = 10;  // Damage dealt to player on contact

        this.state = "idle";  // Possible states: idle, patrol, chase, attack
        this.aggroRange = 250;
        this.attackRange = 50;
        this.speed = 30;

        // attack timing
        this.attackCooldown = 0.9; // seconds
        this.attackTimer = 0;

        // facing hitbox placement
        this.facing = "left";

        this.player = null;
    }

    findPlayer() {
        if (this.player && !this.player.removeFromWorld) {
            return this.player;
        }

        const entities = this.game.entities || this.game.gameEngine?.entities || [];
        this.player = entities.find(e => e && e.name === "Player") || null;
        return this.player;
    }

    onCollision(other) {
        // Handle collision with other entities
        console.log("Enemy collided with:", other.name);

    }

    performAttack() {
        this.attackTimer = this.attackCooldown;

        const hitbox = new AttackHitbox(this, {
            layer: "enemy_attack",
            damage: this.damage,
            knockback: 120,
            size: {
                width: 28,
                height: 24
            },
            offset: {
                x: 0,
                y: 4
            }
        });

        if (typeof this.game.addEntity === "function") {
            this.game.addEntity(hitbox);
        }
        else if (Array.isArray(this.game.entities)) {
            this.game.entities.push(hitbox);
        }
        else if (this.game.gameEngine && Array.isArray(this.game.gameEngine.entities)) {
            this.game.gameEngine.entities.push(hitbox);
        }
        else {
            console.warn("Unable to add attack hitbox to the game.");
        }
    }

    takeDamage(amount) {
        if (this.state == "dead") {
            return;
        }

        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.onDeath();
        }
    }

    update() {

        const dt = this.game.clockTick || 0;
        if (this.state == "dead") {
            return;
        }

        this.attackTimer -= dt;

        const player = this.findPlayer();
        if (!player) {
            super.update();
            return;
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);

        this.facing = dx < 0 ? "left" : "right";

        if (dist > this.aggroRange) {
            this.state = "idle";
        }
        else if (dist > this.attackRange) {
            this.state = "chase";
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);
            this.x += nx * this.speed * dt;
            this.y += ny * this.speed * dt;
        }
        else {
            this.state = "attack";
            if (this.attackTimer <= 0) {
                this.performAttack();
            }
        }
        // Stub for AI logic
        super.update();
    }

    draw(ctx, game) {
        ctx.save();
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = "#fff";
        ctx.fillText(this.name, this.x + 2, this.y + 16);
        ctx.restore();
    }
}

export default Enemy;
