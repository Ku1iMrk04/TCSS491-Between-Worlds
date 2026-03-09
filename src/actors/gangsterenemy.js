import ScientistEnemy from "./scientistenemy.js";
import Animator from "../animation/animator.js";

const GANGSTER_SPEED = 0; // Stationary turret
const GANGSTER_AGGRO_RANGE = 760;
const GANGSTER_ATTACK_RANGE = 760;
const GANGSTER_VISION_RANGE = 760; // Same as attack range for full awareness
const GANGSTER_ATTACK_DELAY = 0.8; // Quick shot delay
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
        this.visionRange = GANGSTER_VISION_RANGE;
        this.visionAngle = 360;
        this.attackDelay = GANGSTER_ATTACK_DELAY;
        this.verticalAwareness = GANGSTER_VERTICAL_AWARENESS;
        this.stairVerticalAwareness = GANGSTER_STAIR_VERTICAL_AWARENESS;

        // Fire one bullet every second to avoid rapid-fire spam.
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
        this.chaseAnimation = "idle";
        this.attackAnimation = "idle";
    }

    canEngagePlayer(player, context) {
        const target = context.targetPos ?? player;
        const gangsterCenterY = this.y + (this.height / 2);
        const targetCenterY = target.y + ((target.height ?? player.height) / 2);
        const verticalAimDelta = Math.abs(targetCenterY - gangsterCenterY);
        const hasHorizontalShot = verticalAimDelta <= this.horizontalAimTolerance;
        const targetOnSecondFloor = target.y <= this.secondFloorY - this.floorTransitionBuffer;

        return context.canSeePlayer ||
            context.sameFloor ||
            context.stairPursuitActive ||
            hasHorizontalShot ||
            targetOnSecondFloor;
    }

    draw(ctx, game) {
        this.animator.draw(ctx, this.x, this.y + this.renderYOffset);
    }
}

export default GangsterEnemy;
