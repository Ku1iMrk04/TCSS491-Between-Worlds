import Collider from "../collision/collider.js";

/**
 * Door — a breakable, immovable obstacle that:
 *   - Instantly kills the player on contact
 *   - Blocks enemy movement (enemies can't open it)
 *   - Blocks enemy line-of-sight
 *   - Can be destroyed by the player's attacks (default: 3 hits)
 */
class Door {
    constructor(game, x, y, width = 32, height = 96) {
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

        this.sprite = game.assetManager.getAsset("assets/door.png");
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) {
            this.removeFromWorld = true;
            this._alertNearbyEnemies();
        }
    }

    _alertNearbyEnemies() {
        const doorCenterX = this.x + this.width / 2;
        const ALERT_RANGE = 400;
        const entities = this.game.entities ?? this.game.gameEngine?.entities ?? [];
        for (const entity of entities) {
            if (entity.removeFromWorld) continue;
            if (typeof entity.onNearbyDoorDestroyed !== "function") continue;
            const ex = entity.x + (entity.width ?? 0) / 2;
            if (Math.abs(ex - doorCenterX) <= ALERT_RANGE) {
                entity.onNearbyDoorDestroyed(doorCenterX);
            }
        }
    }

    update() {
        // Snap back to original position every frame so collision resolution
        // never actually moves the door.
        this.x = this._spawnX;
        this.y = this._spawnY;
    }

    draw(ctx) {
        if (this.sprite) {
            ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
        }
    }
}

export default Door;
