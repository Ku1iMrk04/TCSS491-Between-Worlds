import EnemyProjectile from "./enemyprojectile.js";
import Enemy from "./enemy.js";
import Animator from "../animation/animator.js";

const SCIENTIST_HEALTH = 40;
const SCIENTIST_BASE_SPEED = 30;
const SCIENTIST_SPEED_MULTIPLIER = 1.2;
const SCIENTIST_SPEED = SCIENTIST_BASE_SPEED * SCIENTIST_SPEED_MULTIPLIER;
const SCIENTIST_ATTACK_RANGE = 260;
const SCIENTIST_ATTACK_COOLDOWN_SECONDS = 2.0;
const SCIENTIST_PROJECTILE_SPEED_MULTIPLIER = 12;
// Keep projectile speed aligned to previous feel after movement speed increase.
const SCIENTIST_PROJECTILE_SPEED = SCIENTIST_BASE_SPEED * SCIENTIST_PROJECTILE_SPEED_MULTIPLIER;
const SCIENTIST_PROJECTILE_LIFE = null;
const SCIENTIST_PROJECTILE_DAMAGE = 5;
const SCIENTIST_PROJECTILE_RADIUS = 6;
const SCIENTIST_PROJECTILE_COLOR = "#b6ff00";
const SCIENTIST_PROJECTILE_SPAWN_Y_OFFSET = 0;
const SCIENTIST_PROJECTILE_SPAWN_X_INSET = 6;
const SCIENTIST_PROJECTILE_SPAWN_HEIGHT_RATIO = 0.45;
const SCIENTIST_MIN_TARGET_DISTANCE = 1;
const SCIENTIST_CONTACT_DAMAGE = 0;

class ScientistEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.name = "Scientist";
        this.health = SCIENTIST_HEALTH;
        this.speed = SCIENTIST_SPEED;

        // Ranged behavior tuning
        this.attackRange = SCIENTIST_ATTACK_RANGE;
        this.attackCooldown = SCIENTIST_ATTACK_COOLDOWN_SECONDS;
        this.projectileSpeedMultiplier = SCIENTIST_PROJECTILE_SPEED_MULTIPLIER;
        this.projectileSpeed = SCIENTIST_PROJECTILE_SPEED;
        this.projectileLife = SCIENTIST_PROJECTILE_LIFE;
        this.projectileDamage = SCIENTIST_PROJECTILE_DAMAGE;
        this.projectileRadius = SCIENTIST_PROJECTILE_RADIUS;
        this.projectileColor = SCIENTIST_PROJECTILE_COLOR;
        this.projectileSpawnYOffset = SCIENTIST_PROJECTILE_SPAWN_Y_OFFSET;

        // Scientists are ranged now; body contact should not be lethal.
        this.contactDamage = SCIENTIST_CONTACT_DAMAGE;

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

        const spawnX = this.facing === "left"
            ? this.x + SCIENTIST_PROJECTILE_SPAWN_X_INSET
            : this.x + this.width - SCIENTIST_PROJECTILE_SPAWN_X_INSET;
        const spawnY = this.y + (this.height * SCIENTIST_PROJECTILE_SPAWN_HEIGHT_RATIO) + this.projectileSpawnYOffset;

        const targetX = player.x + (player.width / 2);
        const targetY = player.y + (player.height / 2);
        const dx = targetX - spawnX;
        const dy = targetY - spawnY;
        const dist = Math.sqrt(dx * dx + dy * dy) || SCIENTIST_MIN_TARGET_DISTANCE;

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
