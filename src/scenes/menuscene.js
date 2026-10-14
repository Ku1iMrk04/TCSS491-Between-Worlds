import Scene from "./scene.js";
import GameScene from "./gamescene.js";

class MenuScene extends Scene {
    constructor(game, menuBgImage, levelBgImage) {
        super(game);
        this.menuBgImage  = menuBgImage;
        this.levelBgImage = levelBgImage;

        this.startHover   = false;
        this.startScale    = 0;
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

        // Glitch effect state
        this.glitchTimer    = 0.8 + Math.random() * 1.5;
        this.glitchActive   = false;
        this.glitchDuration = 0;
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

        // Glitch timer
        this.glitchTimer -= dt;
        if (this.glitchTimer <= 0) {
            this.glitchActive   = true;
            this.glitchDuration = 0.06 + Math.random() * 0.12;
            this.glitchTimer    = 0.8 + Math.random() * 1.5;
        }
        if (this.glitchActive) {
            this.glitchDuration -= dt;
            if (this.glitchDuration <= 0) this.glitchActive = false;
        }

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
        if (event.code === "Enter" || event.code === "Space") {
            this.start();
        }
    }

    onClick(x, y) {
        this._ensureMusic();
        // Mute button
        if (this.muteBtnRect) {
            const r = this.muteBtnRect;
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                if (this.game.soundManager) this.game.soundManager.toggleMute();
                return;
            }
        }
        // Volume slider (handled via drag in update(), but a bare click shouldn't start the game)
        if (this.sliderRect) {
            const r = this.sliderRect;
            if (x >= r.x - 10 && x <= r.x + r.w + 10 && y >= r.y - 12 && y <= r.y + r.h + 12) {
                return;
            }
        }

        this.start();
    }

    start() {
        this.game.sceneManager.changeScene(new GameScene(this.game, this.levelBgImage, 0));
    }

    draw(ctx) {
        const w  = ctx.canvas.width;
        const h  = ctx.canvas.height;
        const cx = w / 2;

        // Background with slow horizontal pan (effect 2)
        if (this.menuBgImage) {
            const pan = Math.sin(this.elapsed * 0.1) * 35;
            ctx.drawImage(this.menuBgImage, -40 + pan, 0, w + 80, h);
        } else {
            ctx.fillStyle = "#0d0010";
            ctx.fillRect(0, 0, w, h);
        }

        // Dark overlay
        ctx.fillStyle = "rgba(0,0,0,0.48)";
        ctx.fillRect(0, 0, w, h);

        // Animated purple vignette (effect 8)
        const vigAlpha = 0.78 + Math.sin(this.elapsed * 0.5) * 0.06;
        const vignette = ctx.createRadialGradient(cx, h * 0.5, h * 0.18, cx, h * 0.5, h * 0.9);
        vignette.addColorStop(0, "rgba(0,0,0,0)");
        vignette.addColorStop(1, `rgba(20,0,40,${vigAlpha})`);
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

        // Title with glitch (effect 1)
        this._drawTitle(ctx, cx, h);

        // Tagline
        this._drawTagline(ctx, cx, h);

        // Divider between title and prompt (effect 7)
        this._drawMenuDivider(ctx, w, h / 2 - 20);

        // Start prompt
        this._drawStartPrompt(ctx, h, cx);

        // Volume slider
        this._drawVolumeSlider(ctx, cx, h);

        // CRT scanlines on top of everything (effect 3)
        this._drawScanlines(ctx, w, h);

        ctx.textAlign = "left";
    }

    _drawTagline(ctx, cx, h) {
        ctx.save();
        ctx.textAlign    = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font      = '600 20px "Oxanium", sans-serif';
        ctx.fillStyle = "rgba(225,200,255,0.68)";
        ctx.fillText("Slip between the real and the dream. Clear every room to wake up.", cx, h / 2 - 95);
        ctx.restore();
    }

    // Effect 1: Title with chromatic aberration glitch
    _drawTitle(ctx, cx, h) {
        const titleY = h / 2 - 170;
        const glowA  = 14 + Math.sin(this.elapsed * 1.6) * 10;
        const glowB  = 24 + Math.sin(this.elapsed * 1.6 + 0.7) * 8;

        ctx.save();
        ctx.textAlign    = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = '700 72px "Orbitron", sans-serif';

        if (this.glitchActive) {
            const ox = (Math.random() - 0.5) * 14;
            const oy = (Math.random() - 0.5) * 5;
            // Red channel offset
            ctx.globalAlpha = 0.65;
            ctx.fillStyle   = "#ff2266";
            ctx.fillText("BETWEEN WORLDS", cx + ox + 5, titleY + oy);
            // Cyan channel offset
            ctx.fillStyle   = "#00eeff";
            ctx.fillText("BETWEEN WORLDS", cx - ox - 5, titleY - oy);
            // White main layer (slightly jittered)
            ctx.globalAlpha = 1;
            ctx.fillStyle   = "#ffffff";
            ctx.fillText("BETWEEN WORLDS", cx + (Math.random() - 0.5) * 6, titleY + (Math.random() - 0.5) * 3);
        } else {
            ctx.shadowColor = "#7c3aed";
            ctx.shadowBlur  = glowB;
            ctx.fillStyle   = "rgba(180,120,255,0.25)";
            ctx.fillText("BETWEEN WORLDS", cx, titleY);

            ctx.shadowColor = "#c084fc";
            ctx.shadowBlur  = glowA;
            ctx.fillStyle   = "#ffffff";
            ctx.fillText("BETWEEN WORLDS", cx, titleY);
        }

        ctx.restore();
    }

    // Effect 3: CRT scanlines
    _drawScanlines(ctx, w, h) {
        ctx.save();
        ctx.globalAlpha = 0.045;
        ctx.fillStyle   = "#000000";
        for (let y = 0; y < h; y += 4) {
            ctx.fillRect(0, y, w, 2);
        }
        ctx.restore();
    }

    // Effect 7: Divider between title and buttons
    _drawMenuDivider(ctx, w, y) {
        ctx.save();
        const g = ctx.createLinearGradient(0, y, w, y);
        g.addColorStop(0,   "rgba(124,58,237,0)");
        g.addColorStop(0.5, "rgba(192,132,252,0.45)");
        g.addColorStop(1,   "rgba(124,58,237,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(w * 0.25, y);
        ctx.lineTo(w * 0.75, y);
        ctx.stroke();
        ctx.restore();
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

    // Single breathing "press to start" prompt — content, not a button list
    _drawStartPrompt(ctx, h, cx) {
        const y = h / 2 + 50;

        const mouse = this.game.mouse;
        this.promptRect = { x: cx - 220, y: y - 34, w: 440, h: 60 };
        this.startHover = !!(mouse && mouse.x >= this.promptRect.x && mouse.x <= this.promptRect.x + this.promptRect.w
            && mouse.y >= this.promptRect.y && mouse.y <= this.promptRect.y + this.promptRect.h);

        const target = this.startHover ? 1 : 0;
        this.startScale += (target - this.startScale) * 0.12;

        const pulse = 0.75 + Math.sin(this.elapsed * 2.4) * 0.25;
        const glow  = 14 + pulse * 10 + this.startScale * 14;

        ctx.save();
        ctx.textAlign    = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = '600 30px "Oxanium", sans-serif';
        ctx.shadowColor = "#e879f9";
        ctx.shadowBlur  = glow;
        ctx.fillStyle   = `rgba(255,255,255,${0.75 + this.startScale * 0.25})`;
        ctx.fillText("CLICK OR PRESS ENTER TO BEGIN", cx, y);
        ctx.restore();
    }
}

export default MenuScene;
