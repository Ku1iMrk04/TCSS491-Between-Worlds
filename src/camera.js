/**
 * Camera - Handles viewport tracking with look-ahead, vertical ground snapping,
 * and screen shake (Katana Zero-inspired)
 */
class Camera {
    /**
     * @param {number} viewportWidth - Width of the viewport in pixels
     * @param {number} viewportHeight - Height of the viewport in pixels
     * @param {number} worldWidth - Width of the game world in pixels
     * @param {number} worldHeight - Height of the game world in pixels
     */
    constructor(viewportWidth, viewportHeight, worldWidth, worldHeight) {
        this.viewportWidth = viewportWidth;
        this.viewportHeight = viewportHeight;
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;

        // Camera position in world coordinates (top-left corner of viewport)
        this.x = 0;
        this.y = 0;

        // Target to follow (usually the player)
        this.target = null;

        // Base smoothing for horizontal follow
        this.smoothing = 0.15;

        // --- Look-ahead ---
        this.lookAheadX = 0;
        this.lookAheadAmount = 80;
        this.lookAheadSmoothing = 0.03;
        this.lastFacing = null;
        this.facingChangeDelay = 0.2; // seconds to wait before shifting after a direction change
        this.facingChangeTimer = 0;

        // --- Vertical ground snapping ---
        this.lockedY = null;
        this.verticalLockSmoothing = 0.04;
        this.verticalUnlockThreshold = 150;

        // --- Screen shake ---
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeTimer = 0;
        this.shakeOffsetX = 0;
        this.shakeOffsetY = 0;
    }

    /**
     * Set the entity to follow
     */
    follow(entity) {
        this.target = entity;
        // Initialize lockedY to current target position
        if (entity) {
            this.lockedY = entity.y + (entity.height || 0) / 2;
        }
    }

    /**
     * Trigger screen shake
     * @param {number} intensity - Max pixel offset
     * @param {number} duration - Duration in seconds
     */
    shake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeTimer = duration;
    }

    /**
     * Update camera position to follow target
     * @param {number} dt - Delta time in seconds
     */
    update(dt) {
        if (!this.target) return;

        // --- Look-ahead based on facing direction ---
        // Delay the look-ahead shift when changing direction to avoid jerky camera
        const currentFacing = this.target.facing;
        if (currentFacing !== this.lastFacing) {
            this.facingChangeTimer = this.facingChangeDelay;
            this.lastFacing = currentFacing;
        }

        if (this.facingChangeTimer > 0) {
            this.facingChangeTimer -= dt;
        } else {
            const targetLookAhead = currentFacing === "left"
                ? -this.lookAheadAmount
                : this.lookAheadAmount;
            this.lookAheadX += (targetLookAhead - this.lookAheadX) * this.lookAheadSmoothing;
        }

        // Get target center X
        const targetCenterX = this.target.x + (this.target.width || 0) / 2;

        // Desired X with look-ahead offset
        let desiredX = targetCenterX + this.lookAheadX - this.viewportWidth / 2;

        // --- Vertical ground snapping ---
        const targetCenterY = this.target.y + (this.target.height || 0) / 2;

        // Update locked Y when grounded
        if (this.target.grounded) {
            this.lockedY = targetCenterY;
        }

        // Use locked Y for camera, but follow actual Y if player is too far away
        let cameraTargetY = this.lockedY;
        if (this.lockedY !== null) {
            const distFromLock = Math.abs(targetCenterY - this.lockedY);
            if (distFromLock > this.verticalUnlockThreshold) {
                // Blend toward actual position when far from locked Y
                cameraTargetY = this.lockedY + (targetCenterY - this.lockedY) *
                    ((distFromLock - this.verticalUnlockThreshold) / distFromLock);
            }
        } else {
            cameraTargetY = targetCenterY;
        }

        let desiredY = cameraTargetY - this.viewportHeight / 2;

        // Clamp camera to world bounds
        desiredX = Math.max(0, Math.min(desiredX, this.worldWidth - this.viewportWidth));
        desiredY = Math.max(0, Math.min(desiredY, this.worldHeight - this.viewportHeight));

        // Smooth camera movement
        this.x += (desiredX - this.x) * this.smoothing;
        this.y += (desiredY - this.y) * this.verticalLockSmoothing;

        // Clamp again to prevent floating point drift
        this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.viewportWidth));
        this.y = Math.max(0, Math.min(this.y, this.worldHeight - this.viewportHeight));

        // --- Screen shake ---
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            const progress = Math.max(0, this.shakeTimer / this.shakeDuration);
            const currentIntensity = this.shakeIntensity * progress;
            this.shakeOffsetX = (Math.random() * 2 - 1) * currentIntensity;
            this.shakeOffsetY = (Math.random() * 2 - 1) * currentIntensity;
        } else {
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
        }
    }

    /**
     * Apply camera transform to canvas context
     */
    applyTransform(ctx) {
        ctx.translate(
            -(this.x + this.shakeOffsetX),
            -(this.y + this.shakeOffsetY)
        );
    }

    /**
     * Convert world coordinates to screen coordinates
     */
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x,
            y: worldY - this.y
        };
    }

    /**
     * Convert screen coordinates to world coordinates
     */
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.x,
            y: screenY + this.y
        };
    }

    /**
     * Check if a bounding box is visible in the camera viewport
     */
    isVisible(x, y, width, height) {
        return !(x + width < this.x ||
                x > this.x + this.viewportWidth ||
                y + height < this.y ||
                y > this.y + this.viewportHeight);
    }

    /**
     * Update world bounds (e.g., when loading a new map)
     */
    setWorldBounds(worldWidth, worldHeight) {
        this.worldWidth = worldWidth;
        this.worldHeight = worldHeight;
    }
}

export default Camera;
