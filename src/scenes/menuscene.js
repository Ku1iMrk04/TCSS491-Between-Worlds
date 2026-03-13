import Scene from "./scene.js";
import GameScene from "./gamescene.js";
import { drawOverlay } from "../ui/MenuOverlays.js";

class MenuScene extends Scene {
    constructor(game, menuBgImage, levelBgImage) {
        super(game);
        this.menuBgImage  = menuBgImage;
        this.levelBgImage = levelBgImage;
        this.options      = ["Start Game", "How to Play", "Credits"];
        this.selectedIndex = 0;

        // "howtoplay" | "credits" | null
        this.overlay = null;
        this.closeBtnRect = null;

        this.buttonRects  = [];
        this.hoveredIndex = -1;
        this.hoverScales  = this.options.map(() => 0);
        this.elapsed      = 0;

        // Floating dream particles
        this.particles = [];
        for (let i = 0; i < 55; i++) {
            this.particles.push(this._spawnParticle(true));
        }

        // Volume slider
        this.sliderDragging = false;
        this.sliderRect = null;
        this.muteBtnRect = null;
    }

    _spawnParticle(randomY = false) {
        const colors = ["#c084fc", "#e879f9", "#a855f7", "#ffffff", "#9333ea"];
        return {
            x:         Math.random() * 1920,
            y:         randomY ? Math.random() * 1080 : 1100,
            vx:        (Math.random() - 0.5) * 28,
            vy:        -(22 + Math.random() * 55),
            r:         1.5 + Math.random() * 2.5,
            alpha:     0.35 + Math.random() * 0.55,
            life:      Math.random(),
            lifeSpeed: 0.0018 + Math.random() * 0.004,
            color:     colors[Math.floor(Math.random() * colors.length)],
        };
    }

    enter() {
        if (this.game.soundManager) {
            this.game.soundManager.playMusic("menu");
        }
    }

    exit() {
        if (this.game.soundManager) {
            this.game.soundManager.stopMusic();
        }
    }

    update() {
        const dt = this.game.clockTick;
        this.elapsed += dt;

        // Volume slider drag
        const mouse = this.game.mouse;
        const isDown = this.game.leftMouseDown;
        if (!isDown) {
            this.sliderDragging = false;
        } else if (mouse && this.sliderRect) {
            const r = this.sliderRect;
            if (!this.sliderDragging) {
                if (mouse.x >= r.x - 10 && mouse.x <= r.x + r.w + 10 &&
                    mouse.y >= r.y - 12 && mouse.y <= r.y + r.h + 12) {
                    this.sliderDragging = true;
                }
            }
            if (this.sliderDragging && this.game.soundManager) {
                const ratio = Math.max(0, Math.min(1, (mouse.x - r.x) / r.w));
                this.game.soundManager.setVolume(ratio);
            }
        }

        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life += p.lifeSpeed;
            p.vx += (Math.random() - 0.5) * 3 * dt;
            p.vx = Math.max(-35, Math.min(35, p.vx));
            if (p.y < -20 || p.life > 1) {
                Object.assign(p, this._spawnParticle(false));
            }
        }
    }

    _ensureMusic() {
        if (this.game.soundManager) this.game.soundManager.playMusic("menu");
    }

    onKeyDown(event) {
        this._ensureMusic();
        if (this.overlay) {
            if (event.code === "Escape") this.overlay = null;
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
        this._ensureMusic();
        if (this.overlay) {
            if (this.closeBtnRect) {
                const r = this.closeBtnRect;
                if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                    this.overlay = null;
                }
            }
            return;
        }
        // Mute button
        if (this.muteBtnRect) {
            const r = this.muteBtnRect;
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                if (this.game.soundManager) this.game.soundManager.toggleMute();
                return;
            }
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
        if (this.selectedIndex === 0) {
            this.game.sceneManager.changeScene(new GameScene(this.game, this.levelBgImage, 0));
        } else if (this.selectedIndex === 1) {
            this.overlay = "howtoplay";
        } else if (this.selectedIndex === 2) {
            this.overlay = "credits";
        }
    }

    draw(ctx) {
        const w  = ctx.canvas.width;
        const h  = ctx.canvas.height;
        const cx = w / 2;

        // Background
        if (this.menuBgImage) {
            ctx.drawImage(this.menuBgImage, 0, 0, w, h);
        } else {
            ctx.fillStyle = "#0d0010";
            ctx.fillRect(0, 0, w, h);
        }

        // Dark overlay + purple vignette
        ctx.fillStyle = "rgba(0,0,0,0.48)";
        ctx.fillRect(0, 0, w, h);

        const vignette = ctx.createRadialGradient(cx, h * 0.5, h * 0.18, cx, h * 0.5, h * 0.9);
        vignette.addColorStop(0, "rgba(0,0,0,0)");
        vignette.addColorStop(1, "rgba(20,0,40,0.78)");
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, w, h);

        // Particles
        for (const p of this.particles) {
            const fade = Math.sin(p.life * Math.PI);
            ctx.save();
            ctx.globalAlpha = p.alpha * fade;
            ctx.shadowColor = p.color;
            ctx.shadowBlur  = 10;
            ctx.fillStyle   = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // Title
        const glowA = 14 + Math.sin(this.elapsed * 1.6) * 10;
        const glowB = 24 + Math.sin(this.elapsed * 1.6 + 0.7) * 8;

        ctx.save();
        ctx.textAlign    = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = '700 72px "Orbitron", sans-serif';

        ctx.shadowColor = "#7c3aed";
        ctx.shadowBlur  = glowB;
        ctx.fillStyle   = "rgba(180,120,255,0.25)";
        ctx.fillText("BETWEEN WORLDS", cx, h / 2 - 170);

        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur  = glowA;
        ctx.fillStyle   = "#ffffff";
        ctx.fillText("BETWEEN WORLDS", cx, h / 2 - 170);
        ctx.restore();

        // Buttons
        this._drawButtons(ctx, h, cx);

        // Volume slider
        this._drawVolumeSlider(ctx, cx, h);

        // Footer
        ctx.save();
        ctx.fillStyle    = "rgba(192,132,252,0.55)";
        ctx.font         = '15px "Oxanium", sans-serif';
        ctx.textAlign    = "center";
        ctx.textBaseline = "alphabetic";
        ctx.restore();

        // Overlay (How to Play / Credits)
        if (this.overlay) {
            this.closeBtnRect = drawOverlay(ctx, w, h, this.overlay);
        }

        ctx.textAlign = "left";
    }

    _drawVolumeSlider(ctx, cx, h) {
        const sliderW = 240;
        const sliderH = 8;
        const sliderX = cx - sliderW / 2;
        const sliderY = h - 90;
        this.sliderRect = { x: sliderX, y: sliderY, w: sliderW, h: sliderH };

        const vol = this.game.soundManager ? this.game.soundManager.volume : 0.4;
        const thumbX = sliderX + vol * sliderW;

        ctx.save();

        // Label
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = '600 13px "Oxanium", sans-serif';
        ctx.fillStyle = "rgba(192,132,252,0.65)";
        ctx.fillText("MUSIC VOL", cx, sliderY - 12);

        // Track background
        ctx.beginPath();
        ctx.roundRect(sliderX, sliderY, sliderW, sliderH, 4);
        ctx.fillStyle = "rgba(20,5,45,0.7)";
        ctx.fill();
        ctx.strokeStyle = "rgba(120,70,180,0.45)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Filled portion
        if (vol > 0) {
            ctx.beginPath();
            ctx.roundRect(sliderX, sliderY, vol * sliderW, sliderH, 4);
            ctx.fillStyle = "#a855f7";
            ctx.fill();
        }

        // Thumb
        ctx.beginPath();
        ctx.arc(thumbX, sliderY + sliderH / 2, 8, 0, Math.PI * 2);
        ctx.fillStyle = "#e9d5ff";
        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Percentage
        ctx.font = '13px "Oxanium", sans-serif';
        ctx.fillStyle = "rgba(220,180,255,0.55)";
        ctx.fillText(`${Math.round(vol * 100)}%`, cx, sliderY + sliderH + 20);

        // Mute button to the right of the slider
        const isMuted = this.game.soundManager?.muted ?? false;
        const btnW = 60, btnH = 26;
        const btnX = sliderX + sliderW + 18;
        const btnY = sliderY - btnH / 2 + sliderH / 2;
        this.muteBtnRect = { x: btnX, y: btnY, w: btnW, h: btnH };

        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 5);
        ctx.fillStyle = isMuted
            ? "rgba(120, 20, 20, 0.7)"
            : "rgba(20, 5, 45, 0.7)";
        ctx.fill();
        ctx.strokeStyle = isMuted
            ? "rgba(220, 80, 80, 0.7)"
            : "rgba(120, 70, 180, 0.5)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.font = '600 11px "Oxanium", sans-serif';
        ctx.fillStyle = isMuted ? "rgba(255,120,120,0.9)" : "rgba(192,132,252,0.85)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(isMuted ? "UNMUTE" : "MUTE", btnX + btnW / 2, btnY + btnH / 2);

        ctx.restore();
    }

    _drawButtons(ctx, h, cx) {
        ctx.textAlign    = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = '36px "Oxanium", sans-serif';

        const startY = h / 2 - 10;
        const lineH  = 92;
        const btnW   = 420;
        const btnH   = 66;

        this.buttonRects  = [];
        this.hoveredIndex = -1;

        const mouse = this.game.mouse;
        if (mouse) {
            for (let i = 0; i < this.options.length; i++) {
                const bx = cx - btnW / 2;
                const by = startY + i * lineH - btnH / 2 - 8;
                if (mouse.x >= bx && mouse.x <= bx + btnW && mouse.y >= by && mouse.y <= by + btnH) {
                    this.hoveredIndex  = i;
                    this.selectedIndex = i;
                }
            }
        }

        for (let i = 0; i < this.options.length; i++) {
            const target = (i === this.hoveredIndex || i === this.selectedIndex) ? 1 : 0;
            this.hoverScales[i] += (target - this.hoverScales[i]) * 0.12;
        }

        for (let i = 0; i < this.options.length; i++) {
            const y    = startY + i * lineH;
            const btnX = cx - btnW / 2;
            const btnY = y - btnH / 2 - 8;
            const t    = this.hoverScales[i];
            const scale = 1 + t * 0.05;

            ctx.save();
            ctx.translate(cx, btnY + btnH / 2);
            ctx.scale(scale, scale);
            ctx.translate(-cx, -(btnY + btnH / 2));

            ctx.fillStyle   = `rgba(${20 + Math.round(70 * t)}, 0, ${40 + Math.round(100 * t)}, ${0.08 + t * 0.2})`;
            ctx.strokeStyle = `rgba(${140 + Math.round(52 * t)}, ${Math.round(60 * t)}, ${200 + Math.round(52 * t)}, ${0.35 + t * 0.55})`;
            ctx.lineWidth   = 1.8;
            ctx.beginPath();
            ctx.roundRect(btnX, btnY, btnW, btnH, 8);
            ctx.fill();
            ctx.stroke();

            if (t > 0.01) {
                ctx.shadowColor = "#c084fc";
                ctx.shadowBlur  = t * 22;
            }

            ctx.fillStyle   = `rgba(255,255,255,${0.68 + t * 0.32})`;
            ctx.shadowColor = "transparent";
            ctx.shadowBlur  = 0;
            ctx.fillText(this.options[i], cx, y);
            ctx.restore();

            this.buttonRects.push({ x: btnX, y: btnY, w: btnW, h: btnH });
        }
    }
}

export default MenuScene;
