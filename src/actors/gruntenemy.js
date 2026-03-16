import Enemy from "./enemy.js";
import Animator from "../animation/animator.js";
import AttackHitbox from "../collision/attackhitbox.js";

const GRUNT_HEALTH = 1;
const GRUNT_SPEED = 325; // Faster than the player (275 px/s)
const GRUNT_ATTACK_DELAY = 0.2; // delay before attacking
const GRUNT_ATTACK_COOLDOWN = 1.0; // 1 second cooldown after attack
const GRUNT_VISION_RANGE = 420; // Same as default
const GRUNT_PATROL_RANGE = 96;  // px each direction from spawn point
const GRUNT_PATROL_SPEED = 80;  // slower pace while idle
const GRUNT_SPRITE_NAME = "grunt_sprite_sheet";
const GRUNT_SPRITE_PATH = `assets/${GRUNT_SPRITE_NAME}.png`;
const GRUNT_DEFAULT_ANIMATION_SPEED = 0.1;
const GRUNT_DEFAULT_DEATH_BODY_PERSIST_SECONDS = 2;
const GRUNT_DEFAULT_TURN_UNFLIPPED_END_FACING = "right";
const GRUNT_SLASH_FORWARD_OFFSET = 22;
const GRUNT_SLASH_VERTICAL_OFFSET = 0;

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

        this.animator = new Animator(GRUNT_SPRITE_NAME, this.game.assetManager);
        this.animator.setScale(this.scale);
        this.animator.setVerticalAdjustment(this.height - (this.animator.maxAnimationHeight * this.scale));
        this.animationConfig = this.game.assetManager.getMetadata(GRUNT_SPRITE_PATH) ?? {};
        this.usesAdvancedGruntAnimations = true;
        this.visualFacing = this.facing;
        this.turnInProgress = false;
        this.turnTargetFacing = this.facing;
        this.visualState = "idle";
        this.deathHoldTimer = null;
        this.idleAnimation = "idle";
        this.patrolAnimation = "walk";
        this.chaseAnimation = "run";
        this.attackAnimation = "attack";

        this.setVisualAnimation(this.idleAnimation, this.visualFacing, true);
    }

    getAnimationDefinition(animationName) {
        return this.animationConfig.animations?.[animationName] ?? null;
    }

    getAnimationSpeed(animationName) {
        return this.getAnimationDefinition(animationName)?.frameDuration ?? GRUNT_DEFAULT_ANIMATION_SPEED;
    }

    getAnimationLoop(animationName, fallbackLoop = true) {
        const animationLoop = this.getAnimationDefinition(animationName)?.loop;
        return typeof animationLoop === "boolean" ? animationLoop : fallbackLoop;
    }

    getDeathBodyPersistSeconds() {
        return this.getAnimationDefinition("death")?.holdAfterFinish ??
            GRUNT_DEFAULT_DEATH_BODY_PERSIST_SECONDS;
    }

    getTurnRenderDirection(targetFacing) {
        const playbackMode = this.animationConfig.turnPlaybackMode ?? "flip";
        const unflippedEndFacing = this.animationConfig.turnUnflippedEndFacing ??
            GRUNT_DEFAULT_TURN_UNFLIPPED_END_FACING;
        if (playbackMode !== "flip") {
            return targetFacing;
        }
        return targetFacing === unflippedEndFacing ? "right" : "left";
    }

    isAttackState() {
        return this.state === "waitingToAttack" || this.state === "attacking";
    }

    setVisualAnimation(animationName, direction = this.visualFacing, looping = undefined) {
        const shouldLoop = this.getAnimationLoop(animationName, looping ?? true);
        if (!this.usesAdvancedGruntAnimations) {
            this.animator.setAnimation(animationName, direction, shouldLoop);
            return;
        }

        const animationChanged = this.animator.currAnimationName !== animationName ||
            this.animator.direction !== direction ||
            this.animator.isLooping !== shouldLoop;

        if (animationChanged) {
            this.animator.setAnimation(animationName, direction, shouldLoop);
        } else {
            this.animator.setDirection(direction);
            this.animator.setLooping(shouldLoop);
            this.animator.clearManualFrame();
        }

        this.animator.setSpeed(this.getAnimationSpeed(animationName));
        this.visualState = animationName;
    }

    startTurn(targetFacing) {
        if (!this.usesAdvancedGruntAnimations || targetFacing === this.visualFacing) {
            return;
        }

        this.turnInProgress = true;
        this.turnTargetFacing = targetFacing;
        this.setVisualAnimation("turn", this.getTurnRenderDirection(targetFacing), false);
    }

    updateAdvancedAnimation() {
        if (!this.usesAdvancedGruntAnimations) {
            return;
        }

        if (this.turnInProgress && this.animator.isAnimationFinished()) {
            this.turnInProgress = false;
            this.visualFacing = this.turnTargetFacing;
        }

        if (!this.turnInProgress && this.facing !== this.visualFacing) {
            this.startTurn(this.facing);
        }

        if (this.turnInProgress) {
            return;
        }

        if (this.isAttackState()) {
            this.setVisualAnimation("attack", this.visualFacing, false);
            return;
        }

        const isPatrolling = this.state === "idle" && Math.abs(this.vx) > 0;
        const isChasing = this.state === "chase" && Math.abs(this.vx) > 0;
        const nextAnimation = isChasing
            ? this.chaseAnimation
            : isPatrolling
                ? this.patrolAnimation
                : this.idleAnimation;

        this.setVisualAnimation(nextAnimation, this.visualFacing, true);
    }

    updateDeathSequence(dt) {
        this.animator.update(dt);

        if (this.deathHoldTimer === null) {
            if (this.animator.isAnimationFinished()) {
                this.deathHoldTimer = this.getDeathBodyPersistSeconds();
            }
            return;
        }

        this.deathHoldTimer -= dt;
        if (this.deathHoldTimer <= 0) {
            this.removeFromWorld = true;
        }
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
            if (!this.usesAdvancedGruntAnimations) {
                this.animator.setDirection(this.facing);
            }
        }

        if (!this.usesAdvancedGruntAnimations && this.state === "idle" && Math.abs(this.vx) > 0) {
            this.animator.setAnimation(this.patrolAnimation, this.facing, true);
        }
    }

    performAttack() {
        if (this.usesAdvancedGruntAnimations) {
            this.animator.setAnimation("attack", this.visualFacing, false);
            this.animator.setSpeed(this.getAnimationSpeed("attack"));
            this.visualState = "attack";
        }

        this.attackTimer = this.attackCooldown;

        const hitbox = new AttackHitbox(this, {
            layer: "enemy_attack",
            damage: this.damage,
            knockback: 120,
            size: {
                width: 24 * this.scale,
                height: 24 * this.scale
            },
            offset: {
                x: 4,
                y: 4
            },
            visualEffect: {
                spriteName: GRUNT_SPRITE_NAME,
                animationName: "slash",
                scale: this.scale,
                loop: false,
                disableBottomAlignment: true,
                positionMode: "frontCenter",
                forwardOffset: GRUNT_SLASH_FORWARD_OFFSET,
                offsetY: GRUNT_SLASH_VERTICAL_OFFSET
            }
        });

        if (typeof this.game.addEntity === "function") {
            this.game.addEntity(hitbox);
        }
        else if (Array.isArray(this.game.entities)) {
            this.game.entities.push(hitbox);
        }
        else if (this.game.gameEngine && Array.isArray(this.game.gameEngine.entities)) {
            this.game.gameEngine.entities.push(hitbox);
        }
        else {
            console.warn("Unable to add attack hitbox to the game.");
        }
    }

    onDeath() {
        if (!this.usesAdvancedGruntAnimations) {
            super.onDeath();
            return;
        }
        if (this.state === "dead") {
            return;
        }

        this.state = "dead";
        this.vx = 0;
        this.vy = 0;
        this.alertTimer = 0;
        this.attackTimer = 0;
        this.attackDelayTimer = 0;
        this.stairPursuitTimer = 0;
        this.turnInProgress = false;
        this.clearTargetMemory();
        this.collider = null;
        this.visualFacing = this.animator.direction === "left" ? "left" : "right";
        this.deathHoldTimer = null;
        this.setVisualAnimation("death", this.visualFacing, false);
    }

    getAnimatorDrawPosition() {
        const anchorMode = this.animationConfig.anchor?.mode ?? "topLeft";
        const frameTransform = this.animator.getCurrentFrameTransform();
        const drawWidth = frameTransform.w * this.animator.scale;
        const animation = this.getAnimationDefinition(this.animator.currAnimationName);
        const drawOffsetX = Math.round((animation?.drawOffsetX ?? 0) * this.animator.scale);
        const drawOffsetY = Math.round((animation?.drawOffsetY ?? 0) * this.animator.scale);

        if (anchorMode === "bottomCenter") {
            const worldAnchorX = this.x + (this.width / 2);
            const worldAnchorY = this.y + this.height;
            return {
                x: Math.round(worldAnchorX - (drawWidth / 2) + drawOffsetX),
                y: Math.round(worldAnchorY - this.height + drawOffsetY)
            };
        }

        return {
            x: Math.round(this.x + drawOffsetX),
            y: Math.round(this.y + drawOffsetY)
        };
    }

    update() {
        const dt = this.game.clockTick || 0;
        if (this.state === "dead") {
            if (this.usesAdvancedGruntAnimations) {
                this.updateDeathSequence(dt);
            }
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
            horizontalGap,
            targetReached
        } = this.getTargetContext(player);

        if (targetPos) {
            const faced = this.facing;
            this.facing = centerDx < 0 ? "left" : "right";
            if (!this.usesAdvancedGruntAnimations && this.facing !== faced) {
                this.animator.setDirection(this.facing);
            }
        }

        // Go idle if no target, or if we haven't spotted the player via the vision cone yet.
        // Once hasSeenPlayer is true the enemy always pursues regardless of floor/range limits.
        if (!targetPos || (!this.hasSeenPlayer && !canSeePlayer)) {
            if (this.state !== "idle") {
                this.state = "idle";
                if (!this.usesAdvancedGruntAnimations) {
                    this.animator.setAnimation(this.idleAnimation, this.facing, true);
                }
            }
            this.vx = 0;
            this.performIdleBehavior();
        }
        else if (!canSeePlayer) {
            if (targetReached) {
                this.clearTargetMemory();
                if (this.state !== "idle") {
                    this.state = "idle";
                    if (!this.usesAdvancedGruntAnimations) {
                        this.animator.setAnimation(this.idleAnimation, this.facing, true);
                    }
                }
                this.vx = 0;
            } else {
                if (this.state !== "chase") {
                    this.state = "chase";
                    if (!this.usesAdvancedGruntAnimations) {
                        this.animator.setAnimation(this.chaseAnimation, this.facing, true);
                    }
                }

                let dir = 0;
                if (centerDx > this.horizontalDeadzone) dir = 1;
                else if (centerDx < -this.horizontalDeadzone) dir = -1;
                this.vx = dir * this.speed;
            }
        }
        else if (horizontalGap > this.attackRange) {
            // Chase towards target position (either player or last seen position)
            if (this.state !== "chase") {
                this.state = "chase";
                this.alertTimer = 0.7;
                if (!this.usesAdvancedGruntAnimations) {
                    this.animator.setAnimation(this.chaseAnimation, this.facing, true);
                }
            }

            let dir = 0;
            if (centerDx > this.horizontalDeadzone) dir = 1;
            else if (centerDx < -this.horizontalDeadzone) dir = -1;
            this.vx = dir * this.speed;
        }
        else {
            // In attack range
            if (this.state !== "waitingToAttack" && this.state !== "attacking") {
                this.state = "waitingToAttack";
                this.attackDelayTimer = this.attackDelay;
                if (!this.usesAdvancedGruntAnimations) {
                    this.animator.setAnimation(this.attackAnimation, this.facing, false);
                }
            }
            this.vx = 0;

            // Handle attack delay and cooldown
            if (this.state === "waitingToAttack") {
                if (this.attackDelayTimer <= 0) {
                    this.state = "attacking";
                    this.performAttack();
                }
            }
            else if (this.state === "attacking") {
                if (this.attackTimer <= 0) {
                    this.performAttack();
                }
            }
        }

        // Stop before walking off a ledge
        if (this.grounded && this.vx !== 0) {
            const dir = this.vx > 0 ? 1 : -1;
            if (this.isLedgeAhead(dir)) {
                this.vx = 0;
            }
        }

        this.updateAdvancedAnimation();
        this.finalizeUpdate(wasGrounded);
    }
}

export default GruntEnemy;
