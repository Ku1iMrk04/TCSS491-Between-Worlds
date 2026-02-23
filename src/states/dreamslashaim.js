import State from "./state.js";

class DreamSlashAim extends State {
    constructor() {
        super();
        this.targetWorldX = 0;
        this.targetWorldY = 0;
        this.maxDashDistance = 300;
    }

    enter() {
        const entity = this.myEntity;
        const game = entity.game;

        // Heavy slow-mo while aiming
        game.timeScale = 0.12;

        // Clear any pending release from the initial click
        game.leftMouseReleased = false;

        // Freeze player movement
        entity.vx = 0;

        // Set animation
        if (entity.animator) {
            entity.animator.setAnimation("idle", entity.facing, true);
        }
    }

    do(dt) {
        const entity = this.myEntity;
        const game = entity.game;

        // Keep player frozen during aim
        entity.vx = 0;

        // Track mouse position in world coordinates continuously
        const mouse = game.mouse || game.click;
        if (mouse) {
            const screenX = mouse.x / 2;
            const screenY = mouse.y / 2;
            const worldMouse = game.camera.screenToWorld(screenX, screenY);
            this.targetWorldX = worldMouse.x;
            this.targetWorldY = worldMouse.y;
        }

        // Check for mouse release — use raw time so it's responsive
        if (game.leftMouseReleased) {
            game.leftMouseReleased = false;

            // Store the target on the entity for DreamSlash to use
            const playerCenterX = entity.x + entity.width / 2;
            const playerCenterY = entity.y + entity.height / 2;
            const dx = this.targetWorldX - playerCenterX;
            const dy = this.targetWorldY - playerCenterY;
            const dist = Math.hypot(dx, dy);

            // Clamp to max distance
            if (dist > this.maxDashDistance) {
                entity.dreamSlashTargetX = playerCenterX + (dx / dist) * this.maxDashDistance;
                entity.dreamSlashTargetY = playerCenterY + (dy / dist) * this.maxDashDistance;
            } else {
                entity.dreamSlashTargetX = this.targetWorldX;
                entity.dreamSlashTargetY = this.targetWorldY;
            }

            entity.changeState("dreamslash");
            return;
        }
    }

    exit() {
        // Restore normal speed
        this.myEntity.game.timeScale = 1;
    }

    /**
     * Draw the targeting line from player to mouse cursor.
     * Called from player's draw method.
     */
    drawAimLine(ctx) {
        const entity = this.myEntity;
        const playerCenterX = entity.x + entity.width / 2;
        const playerCenterY = entity.y + entity.height / 2;

        const dx = this.targetWorldX - playerCenterX;
        const dy = this.targetWorldY - playerCenterY;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(dist, this.maxDashDistance);

        // Direction
        const dirX = dist > 0 ? dx / dist : 0;
        const dirY = dist > 0 ? dy / dist : 0;

        const endX = playerCenterX + dirX * clampedDist;
        const endY = playerCenterY + dirY * clampedDist;

        ctx.save();

        // Dashed targeting line
        ctx.strokeStyle = "rgba(180, 80, 255, 0.8)";
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(playerCenterX, playerCenterY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Target circle at end point
        ctx.setLineDash([]);
        ctx.strokeStyle = "rgba(180, 80, 255, 0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(endX, endY, 12, 0, Math.PI * 2);
        ctx.stroke();

        // Inner dot
        ctx.fillStyle = "rgba(200, 120, 255, 0.6)";
        ctx.beginPath();
        ctx.arc(endX, endY, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

export default DreamSlashAim;
