/**
 * Camera - Handles viewport tracking and world-to-screen transformations
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

        // Smoothing factor for camera movement (0 = instant, 1 = very smooth)
        this.smoothing = 0.1;

        // Deadzone - area in center where camera doesn't move
        this.deadzoneWidth = viewportWidth * 0.3;
        this.deadzoneHeight = viewportHeight * 0.3;
    }

    /**
     * Set the entity to follow
     */
    follow(entity) {
        this.target = entity;
    }

    /**
     * Update camera position to follow target
     */
    update() {
        if (!this.target) return;

        // Get target position (center of target)
        const targetCenterX = this.target.x + (this.target.width || 0) / 2;
        const targetCenterY = this.target.y + (this.target.height || 0) / 2;

        // Calculate desired camera position (center target in viewport)
        let desiredX = targetCenterX - this.viewportWidth / 2;
        let desiredY = targetCenterY - this.viewportHeight / 2;

        // Clamp camera to world bounds
        desiredX = Math.max(0, Math.min(desiredX, this.worldWidth - this.viewportWidth));
        desiredY = Math.max(0, Math.min(desiredY, this.worldHeight - this.viewportHeight));

        // Smooth camera movement
        this.x += (desiredX - this.x) * this.smoothing;
        this.y += (desiredY - this.y) * this.smoothing;

        // Clamp again to prevent floating point drift
        this.x = Math.max(0, Math.min(this.x, this.worldWidth - this.viewportWidth));
        this.y = Math.max(0, Math.min(this.y, this.worldHeight - this.viewportHeight));
    }

    /**
     * Apply camera transform to canvas context
     */
    applyTransform(ctx) {
        ctx.translate(-this.x, -this.y);
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