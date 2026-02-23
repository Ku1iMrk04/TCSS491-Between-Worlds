import ScientistEnemy from "./scientistenemy.js";
import Animator from "../animation/animator.js";

const GANGSTER_SPEED = 0;
const GANGSTER_AGGRO_RANGE = 760;
const GANGSTER_ATTACK_RANGE = 760;
const GANGSTER_VERTICAL_AWARENESS = 500;
const GANGSTER_STAIR_VERTICAL_AWARENESS = 500;
const GANGSTER_ATTACK_COOLDOWN_SECONDS = 1;
const GANGSTER_PROJECTILE_SPEED_MULTIPLIER = 18;
const GANGSTER_PROJECTILE_SPEED = 540;
const GANGSTER_PROJECTILE_RADIUS = 2;
const GANGSTER_PROJECTILE_DAMAGE = 1;
const GANGSTER_PROJECTILE_LIFE = null;
const GANGSTER_PROJECTILE_COLOR = "#000000";
const GANGSTER_RENDER_Y_OFFSET = -20;
const GANGSTER_HORIZONTAL_AIM_TOLERANCE = 56;

class GangsterEnemy extends ScientistEnemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.name = "Gangster";

        // Stationary turret behavior with very long detection/shooting range.
        this.speed = GANGSTER_SPEED;
        this.aggroRange = GANGSTER_AGGRO_RANGE;
        this.attackRange = GANGSTER_ATTACK_RANGE;
        this.verticalAwareness = GANGSTER_VERTICAL_AWARENESS;
        this.stairVerticalAwareness = GANGSTER_STAIR_VERTICAL_AWARENESS;

        // Fire one bullet every 4 seconds to avoid rapid-fire spam.
        this.attackCooldown = GANGSTER_ATTACK_COOLDOWN_SECONDS;
        this.projectileSpeedMultiplier = GANGSTER_PROJECTILE_SPEED_MULTIPLIER;
        this.projectileSpeed = GANGSTER_PROJECTILE_SPEED;
        this.projectileRadius = GANGSTER_PROJECTILE_RADIUS;
        this.projectileDamage = GANGSTER_PROJECTILE_DAMAGE;
        this.projectileLife = GANGSTER_PROJECTILE_LIFE;
        this.projectileColor = GANGSTER_PROJECTILE_COLOR;
        this.renderYOffset = GANGSTER_RENDER_Y_OFFSET;
        this.projectileSpawnYOffset = this.renderYOffset;
        this.horizontalAimTolerance = GANGSTER_HORIZONTAL_AIM_TOLERANCE;

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
        const hasHorizontalShot = verticalAimDelta <= this.horizontalAimTolerance;
        const playerOnSecondFloor = player.y <= this.secondFloorY;

        return hasHorizontalShot || playerOnSecondFloor;
    }

    draw(ctx, game) {
        this.animator.draw(ctx, this.x, this.y + this.renderYOffset);
    }
}

export default GangsterEnemy;
