import Enemy from "./enemy.js";
import EnemyProjectile from "./enemyprojectile.js";
import Animator from "../animation/animator.js";

const TURRET_SPRITE_NAME = "turret_sprite_sheet";
const TURRET_SPRITE_PATH = `assets/${TURRET_SPRITE_NAME}.png`;
const TURRET_HEALTH = 2;
const TURRET_CONTACT_DAMAGE = 0;
const TURRET_VISION_RANGE = 420;
const TURRET_STATE_ALERT_DELAY = 0.12;
const TURRET_BURST_SHOT_INTERVAL = 0.16;
const TURRET_BURST_COOLDOWN = 2.0;
const TURRET_BURST_SHOT_COUNT = 2;
const TURRET_PROJECTILE_SPEED = 760;
const TURRET_PROJECTILE_DAMAGE = 999;
const TURRET_PROJECTILE_RADIUS = 4;
const TURRET_PROJECTILE_SCALE = 1.5;
const TURRET_HEAD_TRACK_SPEED = 10;
const TURRET_MAX_AIM_DEGREES = 55;
const TURRET_COMBINED_HEIGHT = 34;
const TURRET_BASE_OVERLAP = 3;
const TURRET_HEAD_PIVOT_X = 22;
const TURRET_HEAD_PIVOT_Y = 13;
const TURRET_MUZZLE_X_RIGHT = 39;
const TURRET_MUZZLE_Y = 7;
const TURRET_DEATH_START_FRAME = 3;
const TURRET_TARGET_HEIGHT_RATIO = 0.45;

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

function drawBottomCenteredSprite(ctx, image, source, centerX, bottomY, scale, flipX = false) {
    if (!image || !source) return;

    const drawWidth = source.w * scale;
    const drawHeight = source.h * scale;
    const drawX = Math.round(centerX - (drawWidth / 2));
    const drawY = Math.round(bottomY - drawHeight);

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (flipX) {
        ctx.scale(-1, 1);
        ctx.drawImage(
            image,
            source.x, source.y, source.w, source.h,
            -drawX - drawWidth, drawY, drawWidth, drawHeight
        );
    } else {
        ctx.drawImage(
            image,
            source.x, source.y, source.w, source.h,
            drawX, drawY, drawWidth, drawHeight
        );
    }

    ctx.restore();
}

function drawBottomAnchoredSprite(ctx, image, source, anchorX, bottomY, scale, flipX = false) {
    if (!image || !source) return;

    const drawWidth = source.w * scale;
    const drawHeight = source.h * scale;
    const drawX = flipX ? Math.round(anchorX - drawWidth) : Math.round(anchorX);
    const drawY = Math.round(bottomY - drawHeight);

    ctx.save();
    ctx.imageSmoothingEnabled = false;

    if (flipX) {
        ctx.scale(-1, 1);
        ctx.drawImage(
            image,
            source.x, source.y, source.w, source.h,
            -drawX - drawWidth, drawY, drawWidth, drawHeight
        );
    } else {
        ctx.drawImage(
            image,
            source.x, source.y, source.w, source.h,
            drawX, drawY, drawWidth, drawHeight
        );
    }

    ctx.restore();
}

function drawCenteredRotatedSprite(ctx, image, source, centerX, centerY, scale, angle) {
    if (!image || !source) return;

    const drawWidth = source.w * scale;
    const drawHeight = source.h * scale;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(centerX), Math.round(centerY));
    ctx.rotate(angle);
    ctx.drawImage(
        image,
        source.x, source.y, source.w, source.h,
        -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight
    );
    ctx.restore();
}

function drawPivotRotatedSprite(ctx, image, source, pivotX, pivotY, pivotOffsetX, pivotOffsetY, scale, angle, flipX = false) {
    if (!image || !source) return;

    const drawWidth = source.w * scale;
    const drawHeight = source.h * scale;

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(pivotX), Math.round(pivotY));
    ctx.rotate(angle);
    if (flipX) {
        ctx.scale(-1, 1);
    }
    ctx.drawImage(
        image,
        source.x, source.y, source.w, source.h,
        -(pivotOffsetX * scale),
        -(pivotOffsetY * scale),
        drawWidth,
        drawHeight
    );
    ctx.restore();
}

function rotateLocalPoint(localX, localY, angle, flipX = false) {
    const x = flipX ? -localX : localX;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
        x: (x * cos) - (localY * sin),
        y: (x * sin) + (localY * cos)
    };
}

class TurretProjectile extends EnemyProjectile {
    constructor(game, x, y, vx, vy, spriteAtlas) {
        super(game, x, y, vx, vy, {
            damage: TURRET_PROJECTILE_DAMAGE,
            radius: TURRET_PROJECTILE_RADIUS,
            color: "#facc15"
        });
        this.spriteAtlas = spriteAtlas;
        this.scale = TURRET_PROJECTILE_SCALE;
        this.angle = Math.atan2(vy, vx);
    }

    draw(ctx, game) {
        const source = this.spriteAtlas?.getFrameSource("bullet", 0);
        if (!this.spriteAtlas?.spriteSheet || !source) {
            super.draw(ctx, game);
            return;
        }

        drawCenteredRotatedSprite(
            ctx,
            this.spriteAtlas.spriteSheet,
            source,
            this.x,
            this.y,
            this.scale,
            this.angle
        );

        if (game.options?.debugging) {
            ctx.save();
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    }
}

class Turret extends Enemy {
    constructor(game, x, y) {
        super(game, x, y);
        this.name = "Turret";
        this.health = TURRET_HEALTH;
        this.speed = 0;
        this.contactDamage = TURRET_CONTACT_DAMAGE;
        this.aggroRange = TURRET_VISION_RANGE;
        this.attackRange = TURRET_VISION_RANGE;
        this.visionRange = TURRET_VISION_RANGE;
        this.visionAngle = 180;
        this.attackDelay = TURRET_STATE_ALERT_DELAY;
        this.attackCooldown = TURRET_BURST_COOLDOWN;
        this.width = 42 * this.scale;
        this.height = TURRET_COMBINED_HEIGHT * this.scale;
        this.setCollider({ layer: "enemy" });

        this.animator = new Animator(TURRET_SPRITE_NAME, this.game.assetManager);
        this.animator.setScale(this.scale);
        this.animator.setAnimation("base", this.facing, true);
        this.animationConfig = this.game.assetManager.getMetadata(TURRET_SPRITE_PATH) ?? {};
        this.spriteAtlas = this.animator.spriteAtlas;

        this.state = "inactive";
        this.stateTimer = 0;
        this.burstShotsRemaining = 0;
        this.currentAimAngle = 0;
        this.sparkEffects = [];
        this.deathDrawAnchorX = null;
        this.deathDrawBottomY = null;
    }

    getAnimationDefinition(name) {
        return this.animationConfig.animations?.[name] ?? null;
    }

    getAnimationSpeed(name, fallback = 0.08) {
        return this.getAnimationDefinition(name)?.frameDuration ?? fallback;
    }

    getBaseSource() {
        return this.spriteAtlas?.getFrameSource("base", 0) ?? null;
    }

    getHeadSource() {
        return this.spriteAtlas?.getFrameSource("head", 0) ?? null;
    }

    getDeathSource() {
        return this.animator.getCurrentFrameSource();
    }

    getDeathDrawAnchorX() {
        if (this.deathDrawAnchorX !== null) {
            return this.deathDrawAnchorX;
        }
        return this.facing === "right" ? this.x : this.x + this.width;
    }

    getDeathDrawBottomY() {
        if (this.deathDrawBottomY !== null) {
            return this.deathDrawBottomY;
        }
        return this.y + this.height;
    }

    getTargetPoint(target) {
        return {
            x: target.x + ((target.width ?? 0) / 2),
            y: target.y + ((target.height ?? 0) * TURRET_TARGET_HEIGHT_RATIO)
        };
    }

    canSeeTargetPoint(targetPoint) {
        if (!targetPoint) return false;

        const tileMap = this.game.tileMap;
        if (!tileMap) return true;

        const origin = this.getHeadPivotPosition();
        const dx = targetPoint.x - origin.x;
        const dy = targetPoint.y - origin.y;
        const distance = Math.hypot(dx, dy);

        if (distance === 0) {
            return true;
        }

        const sampleSpacing = Math.max(4, Math.min(tileMap.tileWidth, tileMap.tileHeight) / 2);
        const sampleCount = Math.ceil(distance / sampleSpacing);

        for (let i = 1; i < sampleCount; i++) {
            const t = i / sampleCount;
            const sampleX = origin.x + (dx * t);
            const sampleY = origin.y + (dy * t);

            if (tileMap.isSolidAtWorld(sampleX, sampleY)) {
                const tileX = Math.floor(sampleX / tileMap.tileWidth);
                const tileY = Math.floor(sampleY / tileMap.tileHeight);
                if (tileMap.getSlopeAt(tileX, tileY)) {
                    continue;
                }
                return false;
            }
        }

        return true;
    }

    getAimData(target) {
        if (!target) return null;

        const targetPoint = this.getTargetPoint(target);
        const headPivot = this.getHeadPivotPosition();
        const dx = targetPoint.x - headPivot.x;
        const dy = targetPoint.y - headPivot.y;
        const facingSign = this.facing === "right" ? 1 : -1;
        const forwardDx = dx * facingSign;

        if (forwardDx <= 0) {
            return null;
        }

        const distance = Math.hypot(dx, dy);
        if (distance > this.visionRange) {
            return null;
        }

        const baseFacingAngle = facingSign === 1 ? 0 : Math.PI;
        const unclampedWorldAngle = Math.atan2(dy, dx);
        const maxAimRadians = TURRET_MAX_AIM_DEGREES * (Math.PI / 180);
        const relativeAngle = clamp(
            normalizeAngle(unclampedWorldAngle - baseFacingAngle),
            -maxAimRadians,
            maxAimRadians
        );
        const worldAngle = baseFacingAngle + relativeAngle;
        return {
            dx,
            dy,
            distance,
            worldAngle,
            relativeAngle,
            targetPoint
        };
    }

    isValidTarget(player) {
        const aimData = this.getAimData(player);
        if (!aimData) {
            return null;
        }
        if (!this.canSeeTargetPoint(aimData.targetPoint)) {
            return null;
        }
        return aimData;
    }

    updateHeadTracking(dt, aimData) {
        const desiredAngle = aimData?.relativeAngle ?? 0;
        const alpha = Math.min(1, dt * TURRET_HEAD_TRACK_SPEED);
        this.currentAimAngle += (desiredAngle - this.currentAimAngle) * alpha;
    }

    getAnchor() {
        return {
            x: this.x + (this.width / 2),
            bottomY: this.y + this.height
        };
    }

    getHeadBottomY() {
        const anchor = this.getAnchor();
        const baseSource = this.getBaseSource();
        if (!baseSource) {
            return anchor.bottomY;
        }
        return anchor.bottomY - ((baseSource.h - TURRET_BASE_OVERLAP) * this.scale);
    }

    getHeadPivotPosition() {
        const anchor = this.getAnchor();
        const headSource = this.getHeadSource();
        if (!headSource) {
            return { x: anchor.x, y: anchor.bottomY - 20 };
        }

        const drawWidth = headSource.w * this.scale;
        const drawHeight = headSource.h * this.scale;
        const headBottomY = this.getHeadBottomY();
        const headTopY = headBottomY - drawHeight;
        const headLeftX = anchor.x - (drawWidth / 2);

        return {
            x: headLeftX + (TURRET_HEAD_PIVOT_X * this.scale),
            y: headTopY + (TURRET_HEAD_PIVOT_Y * this.scale)
        };
    }

    getMuzzlePosition() {
        const pivot = this.getHeadPivotPosition();
        const muzzleLocal = rotateLocalPoint(
            TURRET_MUZZLE_X_RIGHT - TURRET_HEAD_PIVOT_X,
            TURRET_MUZZLE_Y - TURRET_HEAD_PIVOT_Y,
            this.currentAimAngle,
            this.facing === "left"
        );
        return {
            x: pivot.x + (muzzleLocal.x * this.scale),
            y: pivot.y + (muzzleLocal.y * this.scale)
        };
    }

    addSparkEffect(angle) {
        const animator = new Animator(TURRET_SPRITE_NAME, this.game.assetManager);
        animator.setScale(this.scale);
        animator.setAnimation("spark", "right", false);
        animator.setSpeed(this.getAnimationSpeed("spark", 0.05));

        this.sparkEffects.push({
            animator,
            angle,
            ...this.getMuzzlePosition()
        });
    }

    updateSparkEffects(dt) {
        for (const spark of this.sparkEffects) {
            spark.animator.update(dt);
        }

        this.sparkEffects = this.sparkEffects.filter(spark => !spark.animator.isAnimationFinished());
    }

    fireShot(aimData) {
        const muzzle = this.getMuzzlePosition();
        const vx = Math.cos(aimData.worldAngle) * TURRET_PROJECTILE_SPEED;
        const vy = Math.sin(aimData.worldAngle) * TURRET_PROJECTILE_SPEED;
        const projectile = new TurretProjectile(this.game, muzzle.x, muzzle.y, vx, vy, this.spriteAtlas);
        this.game.addEntity(projectile);
        this.addSparkEffect(aimData.worldAngle);
    }

    onDeath() {
        if (this.state === "dying" || this.state === "dead") {
            return;
        }

        this.state = "dying";
        this.vx = 0;
        this.vy = 0;
        this.stateTimer = 0;
        this.burstShotsRemaining = 0;
        this.sparkEffects = [];
        this.contactDamage = 0;
        this.clearTargetMemory();
        this.deathDrawAnchorX = this.facing === "right" ? this.x : this.x + this.width;
        this.deathDrawBottomY = this.y + this.height;
        this.collider = null;
        this.animator.setAnimation("death", this.facing, false);
        this.animator.setSpeed(this.getAnimationSpeed("death", 0.08));
        this.animator.setFrame(TURRET_DEATH_START_FRAME);
    }

    updateLiveState(dt, aimData) {
        if (!aimData) {
            this.state = "inactive";
            this.stateTimer = 0;
            this.burstShotsRemaining = 0;
            return;
        }

        if (this.state === "inactive") {
            this.state = "alerted";
            this.stateTimer = TURRET_STATE_ALERT_DELAY;
            this.burstShotsRemaining = TURRET_BURST_SHOT_COUNT;
        }

        if (this.state === "cooldown") {
            this.stateTimer -= dt;
            if (this.stateTimer <= 0) {
                this.state = "alerted";
                this.stateTimer = TURRET_STATE_ALERT_DELAY;
                this.burstShotsRemaining = TURRET_BURST_SHOT_COUNT;
            }
            return;
        }

        if (this.state === "alerted" || this.state === "firing") {
            this.stateTimer -= dt;
            if (this.stateTimer > 0) {
                return;
            }

            this.fireShot(aimData);
            this.burstShotsRemaining -= 1;

            if (this.burstShotsRemaining > 0) {
                this.state = "firing";
                this.stateTimer = TURRET_BURST_SHOT_INTERVAL;
            } else {
                this.state = "cooldown";
                this.stateTimer = TURRET_BURST_COOLDOWN;
                this.burstShotsRemaining = 0;
            }
        }
    }

    update() {
        const dt = this.game.clockTick || 0;

        if (this.state === "dying") {
            this.animator.update(dt);
            if (this.animator.isAnimationFinished()) {
                this.state = "dead";
            }
            return;
        }

        if (this.state === "dead") {
            return;
        }

        const wasGrounded = this.grounded;
        const player = this.findPlayer();
        const aimData = player ? this.isValidTarget(player) : null;

        this.vx = 0;
        this.updateHeadTracking(dt, aimData);
        this.updateLiveState(dt, aimData);
        this.updateSparkEffects(dt);
        this.finalizeUpdate(wasGrounded);
    }

    draw(ctx, game) {
        const spriteSheet = this.spriteAtlas?.spriteSheet;
        const anchor = this.getAnchor();
        const flipX = this.facing === "left";
        const headPivot = this.getHeadPivotPosition();

        if (this.state === "dying" || this.state === "dead") {
            drawBottomAnchoredSprite(
                ctx,
                spriteSheet,
                this.getDeathSource(),
                this.getDeathDrawAnchorX(),
                this.getDeathDrawBottomY(),
                this.scale,
                flipX
            );
        } else {
            drawBottomCenteredSprite(
                ctx,
                spriteSheet,
                this.getBaseSource(),
                anchor.x,
                anchor.bottomY,
                this.scale,
                flipX
            );

            drawPivotRotatedSprite(
                ctx,
                spriteSheet,
                this.getHeadSource(),
                headPivot.x,
                headPivot.y,
                TURRET_HEAD_PIVOT_X,
                TURRET_HEAD_PIVOT_Y,
                this.scale,
                this.currentAimAngle,
                flipX
            );

            for (const spark of this.sparkEffects) {
                drawCenteredRotatedSprite(
                    ctx,
                    spark.animator.spriteAtlas?.spriteSheet,
                    spark.animator.getCurrentFrameSource(),
                    spark.x,
                    spark.y,
                    spark.animator.scale,
                    spark.angle
                );
            }
        }

        if (game.showHitboxes && this.collider) {
            ctx.save();
            ctx.strokeStyle = "#ff0000";
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.restore();
        }
    }
}

export default Turret;
