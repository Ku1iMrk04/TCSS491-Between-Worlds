import Scene from "./scene.js";

class LevelCompleteScene extends Scene {
    constructor(game, levelBgImage, levelIndex, onRestart, onNextLevel, onMainMenu) {
        super(game);
        this.levelBgImage = levelBgImage;
        this.levelIndex = levelIndex;
        this.onRestart = onRestart;
        this.onNextLevel = onNextLevel;
        this.onMainMenu = onMainMenu;
        this.options = onNextLevel ? ["Next Level", "Restart", "Main Menu"] : ["Restart", "Main Menu"];
        this.selectedIndex = 0;
        this.buttonRects = [];
        this.hoveredIndex = -1;
        this.hoverScales = this.options.map(() => 0);
        this.elapsed = 0;

        // Rising victory particles — purple + gold
        this.particles = [];
        for (let i = 0; i < 50; i++) {
            this.particles.push(this._spawnParticle(true));
        }
    }

    _spawnParticle(randomY = false) {
        const colors = ["#c084fc", "#e879f9", "#fbbf24", "#fde68a", "#a855f7"];
        return {
            x: Math.random() * 1920,
            y: randomY ? Math.random() * 1080 : 1100,
            vx: (Math.random() - 0.5) * 30,
            vy: -(25 + Math.random() * 60),
            r: 1.5 + Math.random() * 2.5,
            alpha: 0.35 + Math.random() * 0.5,
            life: Math.random(),
            lifeSpeed: 0.002 + Math.random() * 0.004,
            color: colors[Math.floor(Math.random() * colors.length)],
        };
    }

    enter() {
        this.game.entities = [];
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
        const option = this.options[this.selectedIndex];
        if (option === "Next Level" && typeof this.onNextLevel === "function") {
            this.game.sceneManager.changeScene(this.onNextLevel());
        } else if (option === "Restart" && typeof this.onRestart === "function") {
            this.game.sceneManager.changeScene(this.onRestart());
        } else if (option === "Main Menu" && typeof this.onMainMenu === "function") {
            this.game.sceneManager.changeScene(this.onMainMenu());
        }
    }

    draw(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        const cx = w / 2;

        // --- Background ---
        ctx.fillStyle = "#05001a";
        ctx.fillRect(0, 0, w, h);

        // Gold/purple radial vignette
        const vig = ctx.createRadialGradient(cx, h * 0.45, h * 0.1, cx, h * 0.45, h * 0.9);
        vig.addColorStop(0, "rgba(0,0,0,0)");
        vig.addColorStop(0.65, "rgba(40,10,80,0.4)");
        vig.addColorStop(1, "rgba(20,5,50,0.85)");
        ctx.fillStyle = vig;
        ctx.fillRect(0, 0, w, h);

        // --- Rising particles ---
        for (const p of this.particles) {
            const fade = Math.sin(p.life * Math.PI);
            ctx.save();
            ctx.globalAlpha = p.alpha * fade;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 10;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // --- Top accent bar ---
        const topBar = ctx.createLinearGradient(0, 0, w, 0);
        topBar.addColorStop(0,   "rgba(124,58,237,0)");
        topBar.addColorStop(0.5, "rgba(251,191,36,0.7)");
        topBar.addColorStop(1,   "rgba(124,58,237,0)");
        ctx.fillStyle = topBar;
        ctx.fillRect(0, 0, w, 3);

        // --- Title ---
        const glowPulse = 16 + Math.sin(this.elapsed * 1.6) * 10;
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";

        // Outer glow pass
        ctx.font = '700 72px "Orbitron", sans-serif';
        ctx.shadowColor = "#92400e";
        ctx.shadowBlur = 40;
        ctx.fillStyle = "rgba(251,191,36,0.2)";
        ctx.fillText("LEVEL CLEARED", cx, h / 2 - 180);

        // Main
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = glowPulse;
        ctx.fillStyle = "#ffffff";
        ctx.fillText("LEVEL CLEARED", cx, h / 2 - 180);
        ctx.restore();

        // --- Level badge ---
        const badgeY = h / 2 - 128;
        const badgeText = `Level ${this.levelIndex + 1}`;
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = '26px "Oxanium", sans-serif';
        ctx.fillStyle = "rgba(251,191,36,0.65)";
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 8;
        ctx.fillText(badgeText, cx, badgeY);
        ctx.restore();

        // --- Subtitle ---
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = '20px "Oxanium", sans-serif';
        ctx.fillStyle = "rgba(192,132,252,0.5)";
        ctx.fillText("All enemies defeated. You pushed further into the dream.", cx, h / 2 - 86);
        ctx.restore();

        // --- Divider ---
        this._drawDivider(ctx, w, h / 2 - 60);

        // --- Buttons ---
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = '34px "Oxanium", sans-serif';

        const startY = h / 2 - 14;
        const lineH = 92;
        const btnW = 400;
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
            // "Next Level" gets gold tint, others get purple
            const isNext = this.options[i] === "Next Level";

            ctx.save();
            ctx.translate(cx, btnY + btnH / 2);
            ctx.scale(scale, scale);
            ctx.translate(-cx, -(btnY + btnH / 2));

            if (isNext) {
                ctx.fillStyle = `rgba(${30 + Math.round(60 * t)}, ${20 + Math.round(40 * t)}, 0, ${0.1 + t * 0.2})`;
                ctx.strokeStyle = `rgba(${180 + Math.round(71 * t)}, ${120 + Math.round(71 * t)}, ${Math.round(20 * t)}, ${0.4 + t * 0.5})`;
            } else {
                ctx.fillStyle = `rgba(${20 + Math.round(60 * t)}, 0, ${40 + Math.round(80 * t)}, ${0.08 + t * 0.18})`;
                ctx.strokeStyle = `rgba(${140 + Math.round(52 * t)}, ${Math.round(60 * t)}, ${200 + Math.round(52 * t)}, ${0.35 + t * 0.55})`;
            }
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.roundRect(btnX, btnY, btnW, btnH, 8);
            ctx.fill();
            ctx.stroke();

            if (t > 0.01) {
                ctx.shadowColor = isNext ? "#fbbf24" : "#c084fc";
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
        ctx.fillStyle = "rgba(192,132,252,0.45)";
        ctx.font = '15px "Oxanium", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("↑ ↓ Arrow Keys + Enter  |  or Click", cx, h - 36);
        ctx.restore();

        ctx.textAlign = "left";
    }

    _drawDivider(ctx, w, y) {
        const g = ctx.createLinearGradient(0, y, w, y);
        g.addColorStop(0,   "rgba(124,58,237,0)");
        g.addColorStop(0.35, "rgba(192,132,252,0.4)");
        g.addColorStop(0.5, "rgba(251,191,36,0.5)");
        g.addColorStop(0.65, "rgba(192,132,252,0.4)");
        g.addColorStop(1,   "rgba(124,58,237,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w * 0.15, y);
        ctx.lineTo(w * 0.85, y);
        ctx.stroke();
    }
}

export default LevelCompleteScene;
