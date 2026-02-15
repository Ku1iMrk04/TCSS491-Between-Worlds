
import State from "./state.js";
import AttackHitbox from "../collision/attackhitbox.js";

class DashStrike extends State {
    constructor() {
        super();
        this.dashSpeed = 600;
        this.maxRange = 300;
        this.damage = 30;
        this.knockback = 200;
        this.timeRemaining = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.dirX = 0;
        this.dirY = 0;
        this.hitDelivered = false;
    }

    enter() {
        const entity = this.myEntity;

        // Use target already found by player
        const target = entity.dashStrikeTarget;

        if (!target) {
            entity.changeState("idle");
            return;
        }

        // Snapshot target center position
        this.targetX = target.x + target.width / 2;
        this.targetY = target.y + target.height / 2;

        // Calculate direction from player center to target center
        const playerCenterX = entity.x + entity.width / 2;
        const playerCenterY = entity.y + entity.height / 2;
        const dx = this.targetX - playerCenterX;
        const dy = this.targetY - playerCenterY;
        const dist = Math.hypot(dx, dy);

        if (dist < 1) {
            entity.changeState("idle");
            return;
        }

        this.dirX = dx / dist;
        this.dirY = dy / dist;
        this.timeRemaining = dist / this.dashSpeed;

        // Invulnerable during dash
        entity.invulnerable = true;

        // Suppress gravity
        entity.grounded = true;
        entity.vy = 0;

        // Face the target
        entity.facing = this.dirX < 0 ? "left" : "right";

        // Set velocity toward target
        entity.vx = this.dirX * this.dashSpeed;
        entity.vy = this.dirY * this.dashSpeed;

        // Reuse roll animation
        if (entity.animator) {
            entity.animator.setAnimation("roll", entity.facing, false);
        }

        this.hitDelivered = false;
    }

    do(dt) {
        const entity = this.myEntity;

        this.timeRemaining -= dt;

        // Keep gravity suppressed
        entity.grounded = true;

        // Maintain dash velocity
        entity.vx = this.dirX * this.dashSpeed;
        entity.vy = this.dirY * this.dashSpeed;

        // Check arrival
        const playerCenterX = entity.x + entity.width / 2;
        const playerCenterY = entity.y + entity.height / 2;
        const distToTarget = Math.hypot(
            this.targetX - playerCenterX,
            this.targetY - playerCenterY
        );

        if (this.timeRemaining <= 0 || distToTarget < 30) {
            if (!this.hitDelivered) {
                this._deliverDamage();
                this.hitDelivered = true;
            }
            entity.changeState("idle");
        }
    }

    exit() {
        const entity = this.myEntity;
        entity.invulnerable = false;
        entity.vx = 0;
        entity.vy = 0;
    }

    _deliverDamage() {
        const entity = this.myEntity;

        const hitbox = new AttackHitbox(entity, {
            offset: { x: 0, y: -10 },
            size: { width: 60, height: 60 },
            damage: this.damage,
            knockback: this.knockback,
            layer: "player_attack"
        });

        entity.game.addEntity(hitbox);
    }
}

export default DashStrike;
