import Enemy from "./enemy.js";
import Animator from "../animation/animator.js";

const GRUNT_HEALTH = 1;
const GRUNT_SPEED = 325; // Faster than the player (275 px/s)
const GRUNT_ATTACK_DELAY = 1.0; // 1 second delay before attacking
const GRUNT_ATTACK_COOLDOWN = 1.0; // 1 second cooldown after attack
const GRUNT_VISION_RANGE = 420; // Same as default

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

        // Idle uses grunt sprite. Missing walk/attack animations fall back to NoSpriteBudda.
        this.animator = new Animator("grunt_idle", this.game.assetManager);
        this.animator.setScale(this.scale);
        this.idleAnimation = "idle";
        this.chaseAnimation = "walk";
        this.attackAnimation = "attack";
    }
}

export default GruntEnemy;
