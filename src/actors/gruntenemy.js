import Enemy from "./enemy.js";
import Animator from "../animation/animator.js";

const GRUNT_HEALTH = 55;
const GRUNT_BASE_SPEED = 35;
const GRUNT_SPEED_MULTIPLIER = 2;
const GRUNT_SPEED = GRUNT_BASE_SPEED * GRUNT_SPEED_MULTIPLIER;

class GruntEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.name = "Grunt";

        // Slightly tankier and faster than scientist enemy.
        this.health = GRUNT_HEALTH;
        this.speed = GRUNT_SPEED;

        // Idle uses grunt sprite. Missing walk/attack animations fall back to NoSpriteBudda.
        this.animator = new Animator("grunt_idle", this.game.assetManager);
        this.animator.setScale(this.scale);
        this.idleAnimation = "idle";
        this.chaseAnimation = "walk";
        this.attackAnimation = "attack";
    }
}

export default GruntEnemy;
