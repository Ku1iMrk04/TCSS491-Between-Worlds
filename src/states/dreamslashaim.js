import State from "./state.js";

class DreamSlashAim extends State {
    constructor() {
        super();
        this.maxDashDistance = 300;
        this.dirX = 1;
        this.dirY = 0;
    }

    _getDirFromInput() {
        const entity = this.myEntity;
        const game = entity.game;

        let dx = 0, dy = 0;
        if (game.left) dx = -1;
        else if (game.right) dx = 1;
        if (game.up) dy = -1;
        else if (game.down) dy = 1;

        // Default to facing direction if no directional input
        if (dx === 0 && dy === 0) {
            dx = entity.facing === "left" ? -1 : 1;
        }

        // Normalize diagonal
        if (dx !== 0 && dy !== 0) {
            const len = Math.SQRT2;
            dx /= len;
            dy /= len;
        }

        return { dx, dy };
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

        // Initialize direction from current input
        const { dx, dy } = this._getDirFromInput();
        this.dirX = dx;
        this.dirY = dy;

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

        // Update direction from WASD input continuously
        const { dx, dy } = this._getDirFromInput();
        this.dirX = dx;
        this.dirY = dy;

        // Check for mouse release — use raw time so it's responsive
        if (game.leftMouseReleased) {
            game.leftMouseReleased = false;

            // Store the target on the entity for DreamSlash to use
            const playerCenterX = entity.x + entity.width / 2;
            const playerCenterY = entity.y + entity.height / 2;
            entity.dreamSlashTargetX = playerCenterX + this.dirX * this.maxDashDistance;
            entity.dreamSlashTargetY = playerCenterY + this.dirY * this.maxDashDistance;

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

        const endX = playerCenterX + this.dirX * this.maxDashDistance;
        const endY = playerCenterY + this.dirY * this.maxDashDistance;

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
