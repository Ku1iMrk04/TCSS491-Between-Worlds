import PauseMenu from "./PauseMenu.js";

const PAUSE_BUTTON_SIZE          = 42;
const PAUSE_BUTTON_MARGIN_TOP    = 18;
const PAUSE_BUTTON_MARGIN_RIGHT  = 18;
const PAUSE_BUTTON_LINE_INSET_X  = 10;
const PAUSE_BUTTON_LINE_START_Y  = 12;
const PAUSE_BUTTON_LINE_GAP      = 8;
const PAUSE_BUTTON_LINE_THICKNESS = 3;

class GameUI {
    constructor(game, levelName = "Level 1") {
        this.game = game;
        this.levelName = levelName;
        this.levelLabelTimer = 0;
        this.pauseMenu = new PauseMenu(game);
        this.pauseMenuButtonRects = [];
        this.pauseButtonRect = null;
    }

    startLevel() {
        this.levelLabelTimer = 3.5;
        this.pauseMenuButtonRects = [];
    }

    update(dt) {
        if (this.levelLabelTimer > 0) {
            this.levelLabelTimer -= dt;
        }
    }

    draw(ctx, player) {
        if (player && player.inDreamState) {
            this.drawDreamStateOverlay(ctx);
        }
        this.drawDreamMeter(ctx, player);
        this.drawLevelLabel(ctx);
    }

    drawOverlay(ctx, isPaused, showPauseControls) {
        this.drawPauseButton(ctx);
        if (isPaused) {
            this.pauseMenu.draw(ctx, showPauseControls);
            this.pauseMenuButtonRects = this.pauseMenu.buttonRects;
        }
    }

    getPauseButtonRect() {
        const canvas = this.game?.ctx?.canvas;
        if (!canvas) return null;
        return {
            x: canvas.width - PAUSE_BUTTON_SIZE - PAUSE_BUTTON_MARGIN_RIGHT,
            y: PAUSE_BUTTON_MARGIN_TOP,
            w: PAUSE_BUTTON_SIZE,
            h: PAUSE_BUTTON_SIZE,
        };
    }

    drawPauseButton(ctx) {
        const rect = this.getPauseButtonRect();
        if (!rect) return;

        this.pauseButtonRect = rect;

        ctx.save();
        ctx.fillStyle = "rgba(10, 0, 25, 0.65)";
        ctx.strokeStyle = "rgba(160, 100, 220, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(rect.x, rect.y, rect.w, rect.h, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "rgba(220, 180, 255, 0.9)";
        const lineWidth = rect.w - PAUSE_BUTTON_LINE_INSET_X * 2;
        for (let i = 0; i < 3; i++) {
            const lineY = rect.y + PAUSE_BUTTON_LINE_START_Y + i * PAUSE_BUTTON_LINE_GAP;
            ctx.beginPath();
            ctx.roundRect(rect.x + PAUSE_BUTTON_LINE_INSET_X, lineY, lineWidth, PAUSE_BUTTON_LINE_THICKNESS, 1);
            ctx.fill();
        }
        ctx.restore();
    }

    drawDreamStateOverlay(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 350);

        ctx.save();

        const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.85);
        vignette.addColorStop(0, "rgba(80, 0, 160, 0)");
        vignette.addColorStop(0.6, `rgba(100, 0, 180, ${0.12 + 0.06 * pulse})`);
        vignette.addColorStop(1, `rgba(160, 0, 255, ${0.45 + 0.15 * pulse})`);
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, w, h);

        const inset = 6;
        ctx.strokeStyle = `rgba(200, 100, 255, ${0.55 + 0.35 * pulse})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur = 24 + 12 * pulse;
        ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);

        ctx.strokeStyle = `rgba(230, 160, 255, ${0.2 + 0.2 * pulse})`;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 8;
        ctx.strokeRect(inset + 8, inset + 8, w - (inset + 8) * 2, h - (inset + 8) * 2);

        ctx.restore();
    }

    drawLevelLabel(ctx) {
        if (this.levelLabelTimer <= 0) return;

        const TOTAL    = 3.5;
        const FADE_IN  = 0.5;
        const FADE_OUT = 1.0;

        let alpha;
        if (this.levelLabelTimer > TOTAL - FADE_IN) {
            alpha = (TOTAL - this.levelLabelTimer) / FADE_IN;
        } else if (this.levelLabelTimer > FADE_OUT) {
            alpha = 1.0;
        } else {
            alpha = this.levelLabelTimer / FADE_OUT;
        }
        alpha = Math.max(0, Math.min(1, alpha));

        const cx = ctx.canvas.width / 2;
        const cy = ctx.canvas.height / 2;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 52px Orbitron, Arial, sans-serif";
        ctx.shadowColor = "#6d28d9";
        ctx.shadowBlur = 32;
        ctx.fillStyle = "#ede9fe";
        ctx.fillText(this.levelName, cx, cy);

        const halfTextW = ctx.measureText(this.levelName).width / 2;
        const lineY = cy + 40;
        const lineGap = 18;
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(167, 139, 250, 0.7)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - halfTextW - lineGap - 40, lineY);
        ctx.lineTo(cx - halfTextW - lineGap, lineY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + halfTextW + lineGap, lineY);
        ctx.lineTo(cx + halfTextW + lineGap + 40, lineY);
        ctx.stroke();

        ctx.restore();
    }

    drawDreamMeter(ctx, player) {
        if (!player) return;

        const meter  = player.dreamMeter;
        const max    = player.dreamMeterMax;
        const active = player.inDreamState;
        const ratio  = max > 0 ? Math.min(meter / max, 1) : 0;
        const isFull = ratio >= 1;

        const MARGIN_LEFT   = 36;
        const MARGIN_BOTTOM = 52;
        const BAT_W         = 200;
        const BAT_H         = 22;
        const NUB_W         = 7;
        const NUB_H         = 12;
        const SEGMENTS      = 7;
        const CORNER        = 3;

        const bx     = MARGIN_LEFT;
        const by     = ctx.canvas.height - MARGIN_BOTTOM - BAT_H;
        const labelX = bx + BAT_W / 2;
        const pulse  = 0.5 + 0.5 * Math.sin(Date.now() / 250);

        ctx.save();

        // Glow on outline
        if (isFull && !active) {
            ctx.shadowColor = "#c084fc";
            ctx.shadowBlur  = 22 + 12 * pulse;
        } else if (active) {
            ctx.shadowColor = "#e879f9";
            ctx.shadowBlur  = 14;
        } else {
            ctx.shadowBlur = 0;
        }

        // Body outline
        ctx.beginPath();
        ctx.roundRect(bx, by, BAT_W, BAT_H, CORNER);
        ctx.fillStyle = "rgba(30, 10, 60, 0.55)";
        ctx.fill();
        ctx.strokeStyle = active
            ? `rgba(232, 121, 249, ${0.85 + 0.15 * pulse})`
            : isFull
                ? `rgba(200, 140, 255, ${0.75 + 0.25 * pulse})`
                : "rgba(120, 70, 180, 0.65)";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Nub
        const nubX = bx + BAT_W + 1;
        const nubY = by + (BAT_H - NUB_H) / 2;
        ctx.beginPath();
        ctx.roundRect(nubX, nubY, NUB_W, NUB_H, 2);
        ctx.fillStyle = active
            ? "rgba(232, 121, 249, 0.7)"
            : isFull
                ? `rgba(200, 140, 255, ${0.6 + 0.4 * pulse})`
                : "rgba(120, 70, 180, 0.5)";
        ctx.fill();

        // Fill bar
        if (ratio > 0) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(bx + 2, by + 2, BAT_W - 4, BAT_H - 4, CORNER - 1);
            ctx.clip();

            const fillW = (BAT_W - 4) * ratio;

            if (active) {
                ctx.fillStyle = "#e879f9";
            } else if (isFull) {
                const r = Math.round(170 + 55 * pulse);
                ctx.fillStyle = `rgb(${r}, 80, 255)`;
            } else {
                const grad = ctx.createLinearGradient(bx + 2, 0, bx + 2 + fillW, 0);
                grad.addColorStop(0, "#7c3aed");
                grad.addColorStop(1, "#c084fc");
                ctx.fillStyle = grad;
            }

            if (isFull && !active) {
                ctx.shadowColor = "#c084fc";
                ctx.shadowBlur  = 10 + 8 * pulse;
            }

            ctx.fillRect(bx + 2, by + 2, fillW, BAT_H - 4);
            ctx.restore();
        }

        // Segment dividers
        ctx.save();
        ctx.strokeStyle = "rgba(10, 0, 30, 0.5)";
        ctx.lineWidth = 1.5;
        for (let i = 1; i < SEGMENTS; i++) {
            const segX = bx + 2 + ((BAT_W - 4) / SEGMENTS) * i;
            ctx.beginPath();
            ctx.moveTo(segX, by + 2);
            ctx.lineTo(segX, by + BAT_H - 2);
            ctx.stroke();
        }
        ctx.restore();

        // Label
        ctx.textAlign    = "center";
        ctx.textBaseline = "bottom";

        if (active) {
            ctx.font        = "bold 13px Orbitron, Arial, sans-serif";
            ctx.shadowColor = "#e879f9";
            ctx.shadowBlur  = 12;
            ctx.fillStyle   = `rgba(232, 121, 249, ${0.9 + 0.1 * pulse})`;
            ctx.fillText("DREAM ACTIVE", labelX, by - 4);
        } else if (isFull) {
            ctx.font        = "bold 13px Orbitron, Arial, sans-serif";
            ctx.shadowColor = "#c084fc";
            ctx.shadowBlur  = 16 + 8 * pulse;
            ctx.fillStyle   = `rgb(${Math.round(210 + 45 * pulse)}, ${Math.round(150 + 30 * pulse)}, 255)`;
            ctx.fillText("DREAM  [E]", labelX, by - 4);
        } else {
            ctx.font        = "bold 11px Orbitron, Arial, sans-serif";
            ctx.shadowBlur  = 0;
            ctx.fillStyle   = "rgba(150, 100, 210, 0.75)";
            ctx.fillText("DREAM", labelX, by - 4);
        }

        ctx.restore();
    }
}

export default GameUI;
