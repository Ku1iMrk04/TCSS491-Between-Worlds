/**
 * Debug overlay that displays global (world) coordinates at mouse position
 */
export class CoordinateOverlay {
    constructor(gameEngine) {
        this.game = gameEngine;
        this.enabled = true; // Start enabled by default
        this.position = { x: 10, y: 0 }; // Bottom-left positioning

        // Add keyboard toggle (press 'C' to toggle coordinate display)
        this.setupKeyboardToggle();
    }

    setupKeyboardToggle() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'c' || e.key === 'C') {
                this.enabled = !this.enabled;
                console.log(`Coordinate overlay ${this.enabled ? 'enabled' : 'disabled'}`);
            }
        });
    }

    draw(ctx) {
        if (!this.enabled) return;

        const mouse = this.game.mouse;
        if (!mouse) return;

        // Get camera to convert screen coordinates to world coordinates
        const camera = this.game.camera;
        let worldX = mouse.x;
        let worldY = mouse.y;

        // If camera exists, convert screen to world coordinates
        // Account for 2x scaling: canvas is 1920x1080, viewport is 960x540
        if (camera && camera.screenToWorld) {
            // Divide by 2 because of the 2x scale applied to gameplay
            const viewportX = mouse.x / 2;
            const viewportY = mouse.y / 2;
            const worldPos = camera.screenToWorld(viewportX, viewportY);
            worldX = worldPos.x;
            worldY = worldPos.y;
        }

        // Draw background box - only show world coordinates
        const text = `World: (${Math.round(worldX)}, ${Math.round(worldY)})`;
        const fontSize = 14;
        ctx.font = `${fontSize}px 'Courier New', monospace`;

        const textWidth = ctx.measureText(text).width;
        const padding = 8;
        const boxWidth = textWidth + padding * 2;
        const boxHeight = fontSize + padding * 2;

        // Position at bottom-right
        const x = ctx.canvas.width - boxWidth - 10;
        const y = ctx.canvas.height - boxHeight - 10;

        // Semi-transparent black background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(x, y, boxWidth, boxHeight);

        // Border
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, boxWidth, boxHeight);

        // Text
        ctx.fillStyle = '#00ff00';
        ctx.fillText(text, x + padding, y + padding + fontSize - 2);

        // Small hint text
        ctx.font = '10px Arial';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText('Press C to toggle', x + padding, y - 4);
    }
}