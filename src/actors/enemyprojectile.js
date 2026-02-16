import Collider from "../collision/collider.js";

class EnemyProjectile {
    constructor(game, x, y, vx, vy, options = {}) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = options.damage ?? 5;
        this.radius = options.radius ?? 3;
        this.life = options.life ?? null;
        this.color = options.color ?? "#b6ff00";
        this.name = "EnemyProjectile";
        this.removeFromWorld = false;
        this.hitEntities = new Set();

        this.collider = new Collider({
            layer: "enemy_projectile",
            isTrigger: true,
            size: {
                width: this.radius * 2,
                height: this.radius * 2
            },
            offset: {
                x: -this.radius,
                y: -this.radius
            }
        });
    }

    hasHit(entity) {
        return this.hitEntities.has(entity);
    }

    markHit(entity) {
        this.hitEntities.add(entity);
    }

    update() {
        const dt = this.game.clockTick || 0;

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        if (this.life !== null) {
            this.life -= dt;
            if (this.life <= 0) {
                this.removeFromWorld = true;
                return;
            }
        }

        const tileMap = this.game.tileMap;
        if (tileMap && tileMap.isSolidAtWorld(this.x, this.y)) {
            this.removeFromWorld = true;
        }
    }

    draw(ctx, game) {
        ctx.save();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        if (game.options?.debugging) {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        ctx.restore();
    }
}

export default EnemyProjectile;
