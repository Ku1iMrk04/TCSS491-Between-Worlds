import Enemy from "./enemy.js";
import Animator from "../animation/animator.js";

class GruntEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.name = "Grunt";

        // Slightly tankier and faster than scientist enemy.
        this.health = 55;
        this.speed = 35;

        // Idle uses grunt sprite. Missing walk/attack animations fall back to NoSpriteBudda.
        this.animator = new Animator("grunt_idle", this.game.assetManager);
        this.animator.setScale(this.scale);
        this.idleAnimation = "idle";
        this.chaseAnimation = "walk";
        this.attackAnimation = "attack";
    }
}

export default GruntEnemy;
