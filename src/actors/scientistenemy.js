import EnemyProjectile from "./enemyprojectile.js";
import Enemy from "./enemy.js";
import Animator from "../animation/animator.js";

const SCIENTIST_HEALTH = 40;
const SCIENTIST_BASE_SPEED = 30;
const SCIENTIST_SPEED_MULTIPLIER = 1.65; // Slightly faster walk speed to better match the current animation cadence
const SCIENTIST_SPEED = SCIENTIST_BASE_SPEED * SCIENTIST_SPEED_MULTIPLIER;
const SCIENTIST_ATTACK_RANGE = 260; // Desired shooting distance
const SCIENTIST_ATTACK_DELAY = 1.5; // Delay before shooting (longer than melee)
const SCIENTIST_ATTACK_COOLDOWN_SECONDS = 2.5; // Cooldown between shots
const SCIENTIST_PROJECTILE_SPEED_MULTIPLIER = 18; // Increased for faster projectiles (inspired by Katana Zero)
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
        this.attackRange = SCIENTIST_ATTACK_RANGE; // Distance at which to start shooting
        this.attackDelay = SCIENTIST_ATTACK_DELAY;
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

    /**
     * Override update for ranged-specific behavior:
     * Chase until in attacking range, then stop and shoot
     * Only resume chase if player gets outside range
     */
    update() {
        const dt = this.game.clockTick || 0;
        if (this.state == "dead") {
            return;
        }
        const wasGrounded = this.grounded;

        this.attackTimer -= dt;
        this.attackDelayTimer -= dt;
        this.stairPursuitTimer = Math.max(0, this.stairPursuitTimer - dt);

        const player = this.findPlayer();
        if (!player) {
            this.finalizeUpdate(wasGrounded);
            return;
        }

        const {
            canSeePlayer,
            targetPos,
            centerDx,
            horizontalDist,
            horizontalGap,
            canEngage,
            targetReached
        } = this.getTargetContext(player);

        if (targetPos) {
            var faced = this.facing;
            this.facing = centerDx < 0 ? "left" : "right";
            if (this.facing !== faced) {
                this.animator.setDirection(this.facing);
            }
        }

        // Ranged enemy behavior: chase until in range, then stop and shoot
        if (!targetPos || !canEngage || (horizontalDist > this.aggroRange && !this.hasSeenPlayer)) {
            // Out of aggro range and haven't seen player
            if (this.state !== "idle") {
                this.state = "idle";
                this.animator.setAnimation(this.idleAnimation, this.facing, true);
            }
            this.vx = 0;
        }
        else if (!canSeePlayer) {
            if (targetReached) {
                this.clearTargetMemory();
                if (this.state !== "idle") {
                    this.state = "idle";
                    this.animator.setAnimation(this.idleAnimation, this.facing, true);
                }
                this.vx = 0;
            } else {
                if (this.state !== "chase") {
                    this.state = "chase";
                    this.animator.setAnimation(this.chaseAnimation, this.facing, true);
                }
                let dir = 0;
                if (centerDx > this.horizontalDeadzone) dir = 1;
                else if (centerDx < -this.horizontalDeadzone) dir = -1;
                this.vx = dir * this.speed;
            }
        }
        else if (horizontalGap > this.attackRange) {
            // Too far away - chase the player
            if (this.state !== "chase") {
                this.state = "chase";
                this.animator.setAnimation(this.chaseAnimation, this.facing, true);
            }
            let dir = 0;
            if (centerDx > this.horizontalDeadzone) dir = 1;
            else if (centerDx < -this.horizontalDeadzone) dir = -1;
            this.vx = dir * this.speed;
        }
        else {
            // In attack range - stop moving and shoot
            if (this.state !== "waitingToAttack" && this.state !== "attacking") {
                this.state = "waitingToAttack";
                this.attackDelayTimer = this.attackDelay;
                this.animator.setAnimation(this.attackAnimation, this.facing, true);
            }
            this.vx = 0;

            // Handle attack delay and cooldown
            if (this.state === "waitingToAttack") {
                if (this.attackDelayTimer <= 0) {
                    this.state = "attacking";
                    this.performAttack();
                }
            }
            else if (this.state === "attacking") {
                if (this.attackTimer <= 0) {
                    this.performAttack();
                }
            }
        }

        this.finalizeUpdate(wasGrounded);
    }

    performAttack() {
        const player = this.findPlayer();
        if (!player) return;
        if (!this.canCurrentlySeePlayer(player)) return;

        this.attackTimer = this.attackCooldown;

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
