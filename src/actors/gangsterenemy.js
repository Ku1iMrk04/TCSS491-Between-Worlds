import ScientistEnemy from "./scientistenemy.js";
import Animator from "../animation/animator.js";

class GangsterEnemy extends ScientistEnemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.name = "Gangster";

        // Stationary turret behavior with very long detection/shooting range.
        this.speed = 0;
        this.aggroRange = 760;
        this.attackRange = 760;
        this.verticalAwareness = 500;
        this.stairVerticalAwareness = 500;

        // Assault-rifle style tuning: quick shots, fast/small black bullets.
        this.attackCooldown = 0.25;
        this.projectileSpeedMultiplier = 18;
        this.projectileSpeed = 540;
        this.projectileRadius = 2;
        this.projectileDamage = 1;
        this.projectileLife = null;
        this.projectileColor = "#000000";
        this.renderYOffset = -20;
        this.projectileSpawnYOffset = this.renderYOffset;

        // Same idle pose while firing.
        this.animator = new Animator("gangsteridle_3", this.game.assetManager);
        this.animator.setScale(this.scale);
        this.idleAnimation = "idle";
        this.chaseAnimation = "walk";
        this.attackAnimation = "idle";
    }

    canEngagePlayer(player, context) {
        // Do not engage while player is transitioning on stairs.
        if (context.playerOnSlope) {
            return false;
        }

        const gangsterCenterY = this.y + (this.height / 2);
        const playerCenterY = player.y + (player.height / 2);
        const verticalAimDelta = Math.abs(playerCenterY - gangsterCenterY);
        const horizontalAimTolerance = 56;

        const hasHorizontalShot = verticalAimDelta <= horizontalAimTolerance;
        const playerOnSecondFloor = player.y <= this.secondFloorY;

        return hasHorizontalShot || playerOnSecondFloor;
    }

    draw(ctx, game) {
        this.animator.draw(ctx, this.x, this.y + this.renderYOffset);
    }
}

export default GangsterEnemy;
