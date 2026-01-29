
import Actor from "./actor.js";

class Enemy extends Actor {
    constructor(game, x, y) {
        super(game, x, y);
        this.ai = null;
        this.name = "Enemy";
        this.damage = 10;  // Damage dealt to player on contact
        this.setCollider({ layer: "enemy" });
    }

    onCollision(other) {
        // Handle collision with other entities
        console.log("Enemy collided with:", other.name);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.onDeath();
        }
    }

    update() {
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
