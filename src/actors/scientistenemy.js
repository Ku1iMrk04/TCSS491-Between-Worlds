import Enemy from "./enemy.js";
import EnemyProjectile from "./enemyprojectile.js";
import Animator from "../animation/animator.js";

class ScientistEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.name = "Scientist";
        this.health = 40;
        this.speed = 30;

        // Ranged behavior tuning
        this.attackRange = 260;
        this.attackCooldown = 2.0;
        this.projectileSpeedMultiplier = 12;
        this.projectileSpeed = null;
        this.projectileLife = null;
        this.projectileDamage = 5;
        this.projectileRadius = 3;
        this.projectileColor = "#b6ff00";
        this.projectileSpawnYOffset = 0;

        // Scientists are ranged now; body contact should not be lethal.
        this.contactDamage = 0;

        this.animator = new Animator("enemy_scientist", this.game.assetManager);
        this.animator.setScale(this.scale);
        this.idleAnimation = "idle";
        this.chaseAnimation = "walk";
        this.attackAnimation = "idle";
    }

    performAttack() {
        this.attackTimer = this.attackCooldown;

        const player = this.findPlayer();
        if (!player) return;

        const spawnX = this.facing === "left" ? this.x + 6 : this.x + this.width - 6;
        const spawnY = this.y + (this.height * 0.45) + this.projectileSpawnYOffset;

        const targetX = player.x + (player.width / 2);
        const targetY = player.y + (player.height / 2);
        const dx = targetX - spawnX;
        const dy = targetY - spawnY;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        const projectileSpeed = this.projectileSpeed ?? (this.speed * this.projectileSpeedMultiplier);
        const vx = (dx / dist) * projectileSpeed;
        const vy = (dy / dist) * projectileSpeed;

        const projectile = new EnemyProjectile(this.game, spawnX, spawnY, vx, vy, {
            damage: this.projectileDamage,
            radius: this.projectileRadius,
            life: this.projectileLife,
            color: this.projectileColor
        });

        if (typeof this.game.addEntity === "function") {
            this.game.addEntity(projectile);
        } else if (Array.isArray(this.game.entities)) {
            this.game.entities.push(projectile);
        } else if (this.game.gameEngine && Array.isArray(this.game.gameEngine.entities)) {
            this.game.gameEngine.entities.push(projectile);
        } else {
            console.warn("Unable to add projectile to the game.");
        }
    }
}

export default ScientistEnemy;
