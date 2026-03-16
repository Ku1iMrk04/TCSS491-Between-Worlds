import Enemy from "./enemy.js";
import Animator from "../animation/animator.js";

const GRUNT_HEALTH = 1;
const GRUNT_SPEED = 325; // Faster than the player (275 px/s)
const GRUNT_ATTACK_DELAY = 0.2; // delay before attacking
const GRUNT_ATTACK_COOLDOWN = 1.0; // 1 second cooldown after attack
const GRUNT_VISION_RANGE = 420; // Same as default
const GRUNT_PATROL_RANGE = 96;  // px each direction from spawn point
const GRUNT_PATROL_SPEED = 80;  // slower pace while idle

class GruntEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.name = "Grunt";

        // Slightly tankier and faster than scientist enemy.
        this.health = GRUNT_HEALTH;
        this.speed = GRUNT_SPEED;

        // Melee attack timing
        this.attackDelay = GRUNT_ATTACK_DELAY;
        this.attackCooldown = GRUNT_ATTACK_COOLDOWN;
        this.visionRange = GRUNT_VISION_RANGE;
        // Default visionAngle of 180 (90 degree cone on each side) is fine

        // Patrol (idle pacing) settings
        this.patrolRange = GRUNT_PATROL_RANGE;
        this.patrolSpeed = GRUNT_PATROL_SPEED;
        this.patrolDir = 1;       // 1 = right, -1 = left
        this.patrolOrigin = null; // set on first idle tick

        // Idle uses grunt sprite. Missing walk/attack animations fall back to NoSpriteBudda.
        this.animator = new Animator("grunt_idle", this.game.assetManager);
        this.animator.setScale(this.scale);
        this.idleAnimation = "idle";
        this.chaseAnimation = "walk";
        this.attackAnimation = "attack";
    }

    performIdleBehavior() {
        // Lock patrol origin to spawn position on first call
        if (this.patrolOrigin === null) {
            this.patrolOrigin = this.x;
        }

        // Reverse at patrol boundaries or ledge drop-offs
        if (this.x >= this.patrolOrigin + this.patrolRange) {
            this.patrolDir = -1;
        } else if (this.x <= this.patrolOrigin - this.patrolRange) {
            this.patrolDir = 1;
        } else if (this.isLedgeAhead(this.patrolDir)) {
            this.patrolDir = -this.patrolDir;
        }

        // Apply patrol velocity and face the right way
        this.vx = this.patrolDir * this.patrolSpeed;
        const newFacing = this.patrolDir > 0 ? "right" : "left";
        if (newFacing !== this.facing) {
            this.facing = newFacing;
            this.animator.setDirection(this.facing);
        }

        // Use walk animation while pacing
        if (this.state === "idle") {
            this.animator.setAnimation(this.chaseAnimation, this.facing, true);
        }
    }
}

export default GruntEnemy;
