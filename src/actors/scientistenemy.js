import EnemyProjectile from "./enemyprojectile.js";
import Enemy from "./enemy.js";
import Animator from "../animation/animator.js";

const SCIENTIST_HEALTH = 1;
const SCIENTIST_BASE_SPEED = 30; // Used for projectile speed calculation
const SCIENTIST_SPEED = 325; // Matches Grunt chase speed
const SCIENTIST_ATTACK_RANGE = 560; // Desired shooting distance
const SCIENTIST_ATTACK_DELAY = 0.5; // Delay before shooting
const SCIENTIST_ATTACK_COOLDOWN_SECONDS = 1.5; // Cooldown between shots
const SCIENTIST_PROJECTILE_SPEED_MULTIPLIER = 30; // Fast Katana-Zero-style projectiles
const SCIENTIST_PROJECTILE_SPEED = SCIENTIST_BASE_SPEED * SCIENTIST_PROJECTILE_SPEED_MULTIPLIER; // 900 px/s
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
     * - Chase until in attack range AND has line-of-sight.
     * - Once in attack stance, hold position and keep shooting even if the player
     *   closes the distance.  Only resume chase if the player escapes beyond
     *   attackRange.
     * - If the player breaks line-of-sight while out of attack stance, chase to
     *   the last known position.
     */
    update() {
        const dt = this.game.clockTick || 0;
        if (this.state == "dead") {
            return;
        }
        const wasGrounded = this.grounded;

        if (this.alertTimer > 0) this.alertTimer -= dt;
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

        const inAttackRange = horizontalGap <= this.attackRange;
        const inAttackMode  = this.state === "waitingToAttack" || this.state === "attacking";

        // --- IDLE: no target yet, or never triggered and out of range/engagement ---
        if (!targetPos || (!this.hasSeenPlayer && (!canEngage || horizontalDist > this.aggroRange))) {
            if (this.state !== "idle") {
                this.state = "idle";
                this.animator.setAnimation(this.idleAnimation, this.facing, true);
            }
            this.vx = 0;

        // --- HOLD POSITION: already in attack stance ---
        // Leave attack mode if the player escapes range OR breaks line-of-sight.
        } else if (inAttackMode) {
            if (!inAttackRange || !canSeePlayer) {
                // Lost range or lost LoS - chase to close in / reacquire
                this.state = "chase";
                this.animator.setAnimation(this.chaseAnimation, this.facing, true);
                let dir = 0;
                if (centerDx > this.horizontalDeadzone) dir = 1;
                else if (centerDx < -this.horizontalDeadzone) dir = -1;
                this.vx = dir * this.speed;
            } else {
                // In range AND has LoS - stay put and shoot
                this.vx = 0;
                if (this.state === "waitingToAttack") {
                    if (this.attackDelayTimer <= 0) {
                        this.state = "attacking";
                        this.performAttack();
                    }
                } else if (this.state === "attacking") {
                    if (this.attackTimer <= 0) {
                        this.performAttack();
                    }
                }
            }

        // --- ENTER ATTACK STANCE: in range AND has line-of-sight ---
        } else if (inAttackRange && canSeePlayer) {
            this.state = "waitingToAttack";
            this.attackDelayTimer = this.attackDelay;
            this.animator.setAnimation(this.attackAnimation, this.facing, true);
            this.vx = 0;

        // --- CHASE (no LoS): pursue last known / current player position ---
        } else if (!canSeePlayer) {
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

        // --- CHASE (has LoS): player visible but out of attack range ---
        } else {
            if (this.state !== "chase") {
                this.state = "chase";
                this.alertTimer = 0.7;
                this.animator.setAnimation(this.chaseAnimation, this.facing, true);
            }
            let dir = 0;
            if (centerDx > this.horizontalDeadzone) dir = 1;
            else if (centerDx < -this.horizontalDeadzone) dir = -1;
            this.vx = dir * this.speed;
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
