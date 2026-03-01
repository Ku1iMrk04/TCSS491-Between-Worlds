import State from "./state.js";
import AttackHitbox from "../collision/attackhitbox.js";

class DreamSlash extends State {
    constructor() {
        super();
        this.blinkSpeed = 800;
        this.damage = 20;
        this.knockback = 100;
        this.timeRemaining = 0;
        this.dirX = 0;
        this.dirY = 0;
        this.hitboxSpawnTimer = 0;
    }

    enter() {
        const entity = this.myEntity;

        // Use target position set by DreamSlashAim
        const playerCenterX = entity.x + entity.width / 2;
        const playerCenterY = entity.y + entity.height / 2;
        const dx = entity.dreamSlashTargetX - playerCenterX;
        const dy = entity.dreamSlashTargetY - playerCenterY;
        const dist = Math.hypot(dx, dy);

        if (dist < 1) {
            entity.changeState("idle");
            return;
        }

        this.dirX = dx / dist;
        this.dirY = dy / dist;
        this.timeRemaining = dist / this.blinkSpeed;
        this.hitboxSpawnTimer = 0;

        // Face the blink direction
        entity.facing = this.dirX < 0 ? "left" : "right";

        // Invulnerable during blink
        entity.invulnerable = true;
        entity.grounded = true;
        entity.vy = 0;

        // Set velocity
        entity.vx = this.dirX * this.blinkSpeed;
        entity.vy = this.dirY * this.blinkSpeed;

        // Deduct dream meter cost
        entity.dreamMeter = Math.max(0, entity.dreamMeter - entity.dreamBlinkCost);

        // Reuse roll animation for the blink
        if (entity.animator) {
            entity.animator.setAnimation("roll", entity.facing, false);
        }
    }

    do(dt) {
        const entity = this.myEntity;

        this.timeRemaining -= dt;

        // Keep gravity suppressed
        entity.grounded = true;

        // Maintain blink velocity
        entity.vx = this.dirX * this.blinkSpeed;
        entity.vy = this.dirY * this.blinkSpeed;

        // Spawn hitboxes along the path to hit everything in the way
        this.hitboxSpawnTimer += dt;
        if (this.hitboxSpawnTimer >= 0.03) {
            this.hitboxSpawnTimer = 0;
            const hitbox = new AttackHitbox(entity, {
                offset: { x: 0, y: -10 },
                size: { width: 50, height: 50 },
                damage: this.damage,
                knockback: this.knockback,
                layer: "player_attack"
            });
            entity.game.addEntity(hitbox);
        }

        // End blink
        if (this.timeRemaining <= 0) {
            // Screen shake on completion
            if (entity.game.camera) {
                entity.game.camera.shake(6, 0.18);
            }
            entity.changeState("idle");
        }
    }

    exit() {
        const entity = this.myEntity;
        entity.invulnerable = false;
        entity.vx = 0;
        entity.vy = 0;

        // Apply cooldown before next dream slash can be triggered
        entity.dreamSlashCooldownTimer = entity.dreamSlashCooldown;

        // Exit dream state if meter is depleted
        if (entity.dreamMeter <= 0 && entity.inDreamState) {
            entity.inDreamState = false;
            entity.speed /= entity.dreamSpeedMultiplier;
        }
    }
}

export default DreamSlash;
