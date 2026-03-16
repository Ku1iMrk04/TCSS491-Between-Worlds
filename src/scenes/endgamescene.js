import Scene from "./scene.js";
import MenuScene from "./menuscene.js";
import { drawOverlay } from "../ui/MenuOverlays.js";

class EndGameScene extends Scene {
    constructor(game, completionTime) {
        super(game);
        this.completionTime = completionTime;
        this.options = ["Credits", "Main Menu"];
        this.selectedIndex = 0;
        this.buttonRects = [];
        this.hoveredIndex = -1;
        this.hoverScales = this.options.map(() => 0);
        this.elapsed = 0;
        this.showCredits = false;
        this.closeBtnRect = null;

        // Rising victory particles — green + gold
        this.particles = [];
        for (let i = 0; i < 60; i++) {
            this.particles.push(this._spawnParticle(true));
        }
    }

    _spawnParticle(randomY = false) {
        const colors = ["#3b82f6", "#60a5fa", "#93c5fd", "#fbbf24", "#2563eb"];
        return {
            x: Math.random() * 1920,
            y: randomY ? Math.random() * 1080 : 1100,
            vx: (Math.random() - 0.5) * 30,
            vy: -(25 + Math.random() * 60),
            r: 1.5 + Math.random() * 3,
            alpha: 0.35 + Math.random() * 0.5,
            life: Math.random(),
            lifeSpeed: 0.002 + Math.random() * 0.004,
            color: colors[Math.floor(Math.random() * colors.length)],
        };
    }

    enter() {
        this.game.entities = [];
        if (this.game.soundManager) {
            this.game.soundManager.stopMusic();
        }
    }

    update() {
        const dt = this.game.clockTick;
        this.elapsed += dt;

        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life += p.lifeSpeed;
            p.vx += (Math.random() - 0.5) * 3 * dt;
            if (p.y < -20 || p.life > 1) {
                Object.assign(p, this._spawnParticle(false));
            }
        }
    }

    onKeyDown(event) {
        if (this.showCredits) {
            if (event.code === "Escape") {
                this.showCredits = false;
            }
            return;
        }

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
        if (this.showCredits) {
            if (this.closeBtnRect) {
                const r = this.closeBtnRect;
                if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                    this.showCredits = false;
                }
            }
            return;
        }

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
        const option = this.options[this.selectedIndex];
        if (option === "Credits") {
            this.showCredits = true;
        } else if (option === "Main Menu") {
            const levelBg = this.game.assetManager.getAsset("assets/level_background.png");
            this.game.sceneManager.changeScene(new MenuScene(this.game, this.game.menuBgImage, levelBg));
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    }

    draw(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        const cx = w / 2;

        // --- Background ---
        ctx.fillStyle = "#0a0a1a";
        ctx.fillRect(0, 0, w, h);

        // Blue radial vignette
        const vig = ctx.createRadialGradient(cx, h * 0.45, h * 0.1, cx, h * 0.45, h * 0.9);
        vig.addColorStop(0, "rgba(0,0,0,0)");
        vig.addColorStop(0.65, "rgba(5,30,60,0.4)");
        vig.addColorStop(1, "rgba(5,15,30,0.85)");
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, w, h);

        // --- Rising particles ---
        for (const p of this.particles) {
            const fade = Math.sin(p.life * Math.PI);
            ctx.save();
            ctx.globalAlpha = p.alpha * fade;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 12;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // --- Top accent bar ---
        const topBar = ctx.createLinearGradient(0, 0, w, 0);
        topBar.addColorStop(0,   "rgba(59,130,246,0)");
        topBar.addColorStop(0.5, "rgba(59,130,246,0.7)");
        topBar.addColorStop(1,   "rgba(59,130,246,0)");
        ctx.fillStyle = topBar;
        ctx.fillRect(0, 0, w, 4);

        // --- Title ---
        const glowPulse = 18 + Math.sin(this.elapsed * 1.6) * 12;
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";

        // Outer glow pass
        ctx.font = '700 84px "Orbitron", sans-serif';
        ctx.shadowColor = "#1e40af";
        ctx.shadowBlur = 45;
        ctx.fillStyle = "rgba(59,130,246,0.25)";
        ctx.fillText("GAME COMPLETE", cx, h / 2 - 220);

        // Main
        ctx.shadowColor = "#3b82f6";
        ctx.shadowBlur = glowPulse;
        ctx.fillStyle = "#ffffff";
        ctx.fillText("GAME COMPLETE", cx, h / 2 - 220);
        ctx.restore();

        // --- Subtitle ---
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = '28px "Oxanium", sans-serif';
        ctx.fillStyle = "rgba(147,197,253,0.8)";
        ctx.shadowColor = "#3b82f6";
        ctx.shadowBlur = 8;
        ctx.fillText("You have conquered all worlds", cx, h / 2 - 154);
        ctx.restore();

        // --- Completion Time ---
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = '42px "Orbitron", sans-serif';
        ctx.fillStyle = "rgba(251,191,36,0.9)";
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 12;
        ctx.fillText(`Time: ${this.formatTime(this.completionTime)}`, cx, h / 2 - 90);
        ctx.restore();

        // --- Divider ---
        this._drawDivider(ctx, w, h / 2 - 50);

        // --- Buttons ---
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = '36px "Oxanium", sans-serif';

        const startY = h / 2 + 10;
        const lineH = 90;
        const btnW = 400;
        const btnH = 66;

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

            ctx.fillStyle = `rgba(${5 + Math.round(50 * t)}, ${20 + Math.round(60 * t)}, ${40 + Math.round(80 * t)}, ${0.1 + t * 0.2})`;
            ctx.strokeStyle = `rgba(${59 + Math.round(71 * t)}, ${130 + Math.round(67 * t)}, ${246 + Math.round(9 * t)}, ${0.4 + t * 0.55})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(btnX, btnY, btnW, btnH, 8);
            ctx.fill();
            ctx.stroke();

            if (t > 0.01) {
                ctx.shadowColor = "#3b82f6";
                ctx.shadowBlur = t * 22;
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
        ctx.fillStyle = "rgba(147,197,253,0.5)";
        ctx.font = '16px "Oxanium", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("↑ ↓ Arrow Keys + Enter  |  or Click", cx, h - 36);
        ctx.restore();

        // Draw credits overlay if active
        if (this.showCredits) {
            this.closeBtnRect = drawOverlay(ctx, w, h, "gamecredits");
        }

        ctx.textAlign = "left";
    }

    _drawDivider(ctx, w, y) {
        const g = ctx.createLinearGradient(0, y, w, y);
        g.addColorStop(0,   "rgba(59,130,246,0)");
        g.addColorStop(0.35, "rgba(96,165,250,0.4)");
        g.addColorStop(0.5, "rgba(251,191,36,0.5)");
        g.addColorStop(0.65, "rgba(96,165,250,0.4)");
        g.addColorStop(1,   "rgba(59,130,246,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.15, y);
        ctx.lineTo(w * 0.85, y);
        ctx.stroke();
    }
}

export default EndGameScene;