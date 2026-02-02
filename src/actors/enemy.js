import Actor from "./actor.js";
import AttackHitbox from "../collision/attackhitbox.js";
import Animator from "../animation/animator.js";

class Enemy extends Actor {
    constructor(game, x, y) {
        super(game, x, y);
        this.ai = null;
        this.name = "Enemy";
        this.scale = 3;
        this.width = 22 * this.scale;
        this.height = 40 * this.scale;
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
        this.animator = new Animator("enemy_scientist", this.game.assetManager);
        this.animator.setScale(this.scale);
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
                width: 28 * (this.scale - 2),
                height: 24 * this.scale
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

        var faced = this.facing;
        this.facing = dx < 0 ? "left" : "right";
        if (this.facing !== faced) {
            this.animator.setDirection(this.facing);
        }

        if (dist > this.aggroRange) {
            if (this.state !== "idle") {
                this.state = "idle";
                this.animator.setAnimation("idle", this.facing, true);
            }
        }
        else if (dist > this.attackRange) {
            if (this.state !== "chase") {
                this.state = "chase";
                this.animator.setAnimation("walk", this.facing, true);
            }
            const nx = dx / (dist || 1);
            const ny = dy / (dist || 1);
            this.x += nx * this.speed * dt;
            this.y += ny * this.speed * dt;
        }
        else {
            if (this.state !== "attack") {
                this.state = "attack";
                this.animator.setAnimation("idle", this.facing, true);
            }
            if (this.attackTimer <= 0) {
                this.performAttack();
            }
        }
        this.animator.update(dt);

        // Stub for AI logic
        super.update();

    }

    draw(ctx, game) {
        this.animator.draw(ctx, this.x, this.y);
        // ctx.save();
        // ctx.fillStyle = "#e74c3c";
        // ctx.fillRect(this.x, this.y, this.width, this.height);
        // ctx.font = "9px sans-serif";
        // ctx.fillStyle = "#fff";
        // ctx.fillText(this.name, this.x + 2, this.y + 15);
        // ctx.restore();
    }
}

export default Enemy;
