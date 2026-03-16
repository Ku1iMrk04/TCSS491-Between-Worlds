import Collider from "../collision/collider.js";

/**
 * Door — a breakable, immovable obstacle that:
 *   - Instantly kills the player on contact
 *   - Blocks enemy movement (enemies can't open it)
 *   - Blocks enemy line-of-sight
 *   - Can be destroyed by the player's attacks (default: 3 hits)
 */
class Door {
    constructor(game, x, y, width = 32, height = 64) {
        this.game = game;
        this.name = "Door";

        this.x = x;
        this.y = y;
        this._spawnX = x;
        this._spawnY = y;

        this.width = width;
        this.height = height;

        this.maxHealth = 1;
        this.health = this.maxHealth;

        this.removeFromWorld = false;
        this.isImmovable = true;   // tells CollisionManager not to move this entity

        this.collider = new Collider({
            layer: "door",
            size: { width: this.width, height: this.height }
        });
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) {
            this.removeFromWorld = true;
        }
    }

    update() {
        // Snap back to original position every frame so collision resolution
        // never actually moves the door.
        this.x = this._spawnX;
        this.y = this._spawnY;
    }

    draw(ctx) {
        const x = this.x;
        const y = this.y;
        const w = this.width;
        const h = this.height;

        const healthFrac = this.health / this.maxHealth;

        ctx.save();

        // Base color: steel gray, shifts toward dark red as health drops
        const rBase = Math.floor(55 + (1 - healthFrac) * 90);
        const gBase = Math.floor(65 - (1 - healthFrac) * 35);
        const bBase = Math.floor(75 - (1 - healthFrac) * 35);
        ctx.fillStyle = `rgb(${rBase},${gBase},${bBase})`;
        ctx.fillRect(x, y, w, h);

        // Horizontal panel dividers
        const panelCount = 3;
        const panelH = h / panelCount;
        ctx.strokeStyle = "rgba(0,0,0,0.55)";
        ctx.lineWidth = 1;
        for (let i = 1; i < panelCount; i++) {
            const py = y + panelH * i;
            ctx.beginPath();
            ctx.moveTo(x + 3, py);
            ctx.lineTo(x + w - 3, py);
            ctx.stroke();
        }

        // Light highlight on upper half of each panel
        ctx.fillStyle = "rgba(255,255,255,0.07)";
        for (let i = 0; i < panelCount; i++) {
            ctx.fillRect(x + 3, y + panelH * i + 3, w - 6, panelH * 0.45 - 2);
        }

        // Outer border
        ctx.strokeStyle = "rgba(0,0,0,0.85)";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // Cracks that appear as health drops
        if (healthFrac < 1) {
            ctx.strokeStyle = `rgba(0,0,0,${(1 - healthFrac) * 0.75})`;
            ctx.lineWidth = 1;

            if (healthFrac <= 0.67) {
                ctx.beginPath();
                ctx.moveTo(x + w * 0.28, y + h * 0.15);
                ctx.lineTo(x + w * 0.48, y + h * 0.42);
                ctx.lineTo(x + w * 0.38, y + h * 0.62);
                ctx.stroke();
            }
            if (healthFrac <= 0.34) {
                ctx.beginPath();
                ctx.moveTo(x + w * 0.62, y + h * 0.28);
                ctx.lineTo(x + w * 0.45, y + h * 0.52);
                ctx.lineTo(x + w * 0.67, y + h * 0.74);
                ctx.stroke();
            }
        }

        ctx.restore();
    }
}

export default Door;
