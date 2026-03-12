import Scene from "./scene.js";
import GameScene from "./gamescene.js";
import MenuScene from "./menuscene.js";

class DeathScene extends Scene {
    constructor(game, levelBgImage, levelIndex = 0) {
        super(game);
        this.levelBgImage = levelBgImage;
        this.levelIndex = levelIndex;
        this.options = ["Retry", "Main Menu"];
        this.selectedIndex = 0;
        this.buttonRects = [];
        this.hoveredIndex = -1;
        this.hoverScales = this.options.map(() => 0);
        this.elapsed = 0;

        // Falling ember particles
        this.particles = [];
        for (let i = 0; i < 45; i++) {
            this.particles.push(this._spawnParticle(true));
        }
    }

    _spawnParticle(randomY = false) {
        const colors = ["#ef4444", "#dc2626", "#b91c1c", "#fca5a5", "#7f1d1d"];
        return {
            x: Math.random() * 1920,
            y: randomY ? Math.random() * 1080 : -10,
            vx: (Math.random() - 0.5) * 22,
            vy: 28 + Math.random() * 55,
            r: 1.2 + Math.random() * 2.2,
            alpha: 0.3 + Math.random() * 0.5,
            life: Math.random(),
            lifeSpeed: 0.0018 + Math.random() * 0.003,
            color: colors[Math.floor(Math.random() * colors.length)],
        };
    }

    update() {
        const dt = this.game.clockTick;
        this.elapsed += dt;
        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life += p.lifeSpeed;
            if (p.y > 1100 || p.life > 1) {
                Object.assign(p, this._spawnParticle(false));
            }
        }
    }

    onKeyDown(event) {
        switch (event.code) {
            case "ArrowUp":
                this.selectedIndex = (this.selectedIndex + this.options.length - 1) % this.options.length;
                break;
            case "ArrowDown":
                this.selectedIndex = (this.selectedIndex + 1) % this.options.length;
                break;
            case "Enter":
                this.activateSelection();
                break;
        }
    }

    onClick(x, y) {
        for (let i = 0; i < this.buttonRects.length; i++) {
            const r = this.buttonRects[i];
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                this.selectedIndex = i;
                this.activateSelection();
                return;
            }
        }
    }

    activateSelection() {
        if (this.selectedIndex === 0) {
            this.game.sceneManager.changeScene(new GameScene(this.game, this.levelBgImage, this.levelIndex));
        } else {
            const levelBg = this.game.assetManager.getAsset("assets/level_background.png");
            this.game.sceneManager.changeScene(new MenuScene(this.game, this.game.menuBgImage, levelBg));
        }
    }

    draw(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        const cx = w / 2;

        // --- Background ---
        ctx.fillStyle = "#060004";
        ctx.fillRect(0, 0, w, h);

        // Red radial vignette
        const vig = ctx.createRadialGradient(cx, h * 0.45, h * 0.1, cx, h * 0.45, h * 0.85);
        vig.addColorStop(0, "rgba(0,0,0,0)");
        vig.addColorStop(0.7, "rgba(80,0,0,0.35)");
        vig.addColorStop(1, "rgba(120,0,0,0.75)");
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, w, h);

        // --- Falling particles ---
        for (const p of this.particles) {
            const fade = Math.sin(p.life * Math.PI);
            ctx.save();
            ctx.globalAlpha = p.alpha * fade;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 8;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // --- Top accent bar ---
        const topBar = ctx.createLinearGradient(0, 0, w, 0);
        topBar.addColorStop(0,   "rgba(185,28,28,0)");
        topBar.addColorStop(0.5, "rgba(239,68,68,0.85)");
        topBar.addColorStop(1,   "rgba(185,28,28,0)");
        ctx.fillStyle = topBar;
        ctx.fillRect(0, 0, w, 3);

        // --- "YOU DIED" title ---
        const glowR = 18 + Math.sin(this.elapsed * 1.4) * 10;
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";

        // Outer glow pass
        ctx.font = '700 88px "Orbitron", sans-serif';
        ctx.shadowColor = "#7f1d1d";
        ctx.shadowBlur = 40;
        ctx.fillStyle = "rgba(220,50,50,0.2)";
        ctx.fillText("YOU DIED", cx, h / 2 - 160);

        // Main text
        ctx.shadowColor = "#ef4444";
        ctx.shadowBlur = glowR;
        ctx.fillStyle = "#ffffff";
        ctx.fillText("YOU DIED", cx, h / 2 - 160);
        ctx.restore();

        // --- Subtitle ---
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = '22px "Oxanium", sans-serif';
        ctx.fillStyle = "rgba(252,165,165,0.45)";
        ctx.fillText("The dream consumed you...", cx, h / 2 - 100);
        ctx.restore();

        // --- Divider ---
        this._drawDivider(ctx, w, h / 2 - 68);

        // --- Buttons ---
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = '34px "Oxanium", sans-serif';

        const startY = h / 2 - 10;
        const lineH = 92;
        const btnW = 380;
        const btnH = 64;

        this.buttonRects = [];

        const mouse = this.game.mouse;
        this.hoveredIndex = -1;
        if (mouse) {
            for (let i = 0; i < this.options.length; i++) {
                const bx = cx - btnW / 2;
                const by = startY + i * lineH - btnH / 2 - 8;
                if (mouse.x >= bx && mouse.x <= bx + btnW && mouse.y >= by && mouse.y <= by + btnH) {
                    this.hoveredIndex = i;
                    this.selectedIndex = i;
                }
            }
        }

        const speed = 0.12;
        for (let i = 0; i < this.options.length; i++) {
            const target = (i === this.hoveredIndex || i === this.selectedIndex) ? 1 : 0;
            this.hoverScales[i] += (target - this.hoverScales[i]) * speed;
        }

        for (let i = 0; i < this.options.length; i++) {
            const y = startY + i * lineH;
            const btnX = cx - btnW / 2;
            const btnY = y - btnH / 2 - 8;
            const t = this.hoverScales[i];
            const scale = 1 + t * 0.05;

            ctx.save();
            ctx.translate(cx, btnY + btnH / 2);
            ctx.scale(scale, scale);
            ctx.translate(-cx, -(btnY + btnH / 2));

            // "Retry" gets red tint, "Main Menu" gets neutral
            const isRetry = i === 0;
            if (isRetry) {
                ctx.fillStyle = `rgba(${100 + Math.round(80 * t)}, 0, 0, ${0.1 + t * 0.2})`;
                ctx.strokeStyle = `rgba(${180 + Math.round(59 * t)}, ${Math.round(30 * t)}, ${Math.round(30 * t)}, ${0.35 + t * 0.55})`;
            } else {
                ctx.fillStyle = `rgba(40, 0, 0, ${0.08 + t * 0.15})`;
                ctx.strokeStyle = `rgba(${140 + Math.round(60 * t)}, ${Math.round(50 * t)}, ${Math.round(50 * t)}, ${0.3 + t * 0.5})`;
            }
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.roundRect(btnX, btnY, btnW, btnH, 8);
            ctx.fill();
            ctx.stroke();

            if (t > 0.01) {
                ctx.shadowColor = isRetry ? "#ef4444" : "#dc2626";
                ctx.shadowBlur = t * 20;
            }

            ctx.fillStyle = `rgba(255,255,255,${0.68 + t * 0.32})`;
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.fillText(this.options[i], cx, y);
            ctx.restore();

            this.buttonRects.push({ x: btnX, y: btnY, w: btnW, h: btnH });
        }

        // --- Footer ---
        ctx.save();
        ctx.fillStyle = "rgba(252,165,165,0.4)";
        ctx.font = '15px "Oxanium", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("↑ ↓ Arrow Keys + Enter  |  or Click", cx, h - 36);
        ctx.restore();

        ctx.textAlign = "left";
    }

    _drawDivider(ctx, w, y) {
        const g = ctx.createLinearGradient(0, y, w, y);
        g.addColorStop(0,   "rgba(185,28,28,0)");
        g.addColorStop(0.5, "rgba(239,68,68,0.4)");
        g.addColorStop(1,   "rgba(185,28,28,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w * 0.2, y);
        ctx.lineTo(w * 0.8, y);
        ctx.stroke();
    }
}

export default DeathScene;
