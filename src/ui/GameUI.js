const PAUSE_BUTTON_SIZE = 42;
const PAUSE_BUTTON_MARGIN_TOP = 18;
const PAUSE_BUTTON_MARGIN_RIGHT = 18;
const PAUSE_BUTTON_LINE_INSET_X = 10;
const PAUSE_BUTTON_LINE_START_Y = 12;
const PAUSE_BUTTON_LINE_GAP = 8;
const PAUSE_BUTTON_LINE_THICKNESS = 3;

const PAUSE_OPTION_RESUME = "Resume";
const PAUSE_OPTION_RESTART = "Restart";
const PAUSE_OPTION_CONTROLS = "Controls";
const PAUSE_OVERLAY_OPTIONS = [PAUSE_OPTION_RESUME, PAUSE_OPTION_RESTART, PAUSE_OPTION_CONTROLS];

const PAUSE_OVERLAY_PANEL_WIDTH = 900;
const PAUSE_OVERLAY_PANEL_HEIGHT = 560;
const PAUSE_OVERLAY_TITLE_Y_OFFSET = 52;
const PAUSE_OVERLAY_OPTIONS_Y_OFFSET = 110;
const PAUSE_OVERLAY_OPTION_WIDTH = 220;
const PAUSE_OVERLAY_OPTION_HEIGHT = 52;
const PAUSE_OVERLAY_OPTION_GAP = 18;
const PAUSE_OVERLAY_CONTROLS_BOX_MARGIN_X = 34;
const PAUSE_OVERLAY_CONTROLS_BOX_Y_OFFSET = 190;
const PAUSE_OVERLAY_CONTROLS_BOX_HEIGHT = 320;
const PAUSE_OVERLAY_CONTROLS_TEXT_PADDING = 24;
const PAUSE_OVERLAY_CONTROLS_LINE_HEIGHT = 34;

const PAUSE_CONTROLS_LINES = [
    "Controls:",
    "Move: WASD / Arrow Keys",
    "Attack: Left Click",
    "Roll: Left Shift",
    "Dream State: E (when meter is full)",
];

class GameUI {
    constructor(game, levelName = "Level 1") {
        this.game = game;
        this.levelName = levelName;
        this.levelLabelTimer = 0;
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
            this.drawPauseOverlay(ctx, showPauseControls);
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
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineWidth = 2;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

        ctx.fillStyle = "#ffffff";
        const lineWidth = rect.w - PAUSE_BUTTON_LINE_INSET_X * 2;
        for (let i = 0; i < 3; i++) {
            const lineY = rect.y + PAUSE_BUTTON_LINE_START_Y + i * PAUSE_BUTTON_LINE_GAP;
            ctx.fillRect(rect.x + PAUSE_BUTTON_LINE_INSET_X, lineY, lineWidth, PAUSE_BUTTON_LINE_THICKNESS);
        }
        ctx.restore();
    }

    drawPauseOverlay(ctx, showPauseControls) {
        const canvasW = ctx.canvas.width;
        const canvasH = ctx.canvas.height;
        const panelX = (canvasW - PAUSE_OVERLAY_PANEL_WIDTH) / 2;
        const panelY = (canvasH - PAUSE_OVERLAY_PANEL_HEIGHT) / 2;

        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.fillRect(0, 0, canvasW, canvasH);

        ctx.fillStyle = "rgba(16, 24, 48, 0.95)";
        ctx.fillRect(panelX, panelY, PAUSE_OVERLAY_PANEL_WIDTH, PAUSE_OVERLAY_PANEL_HEIGHT);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, PAUSE_OVERLAY_PANEL_WIDTH, PAUSE_OVERLAY_PANEL_HEIGHT);

        ctx.fillStyle = "white";
        ctx.font = '44px "Orbitron", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Paused", panelX + PAUSE_OVERLAY_PANEL_WIDTH / 2, panelY + PAUSE_OVERLAY_TITLE_Y_OFFSET);

        this.pauseMenuButtonRects = [];
        const totalButtonsWidth =
            PAUSE_OVERLAY_OPTION_WIDTH * PAUSE_OVERLAY_OPTIONS.length +
            PAUSE_OVERLAY_OPTION_GAP * (PAUSE_OVERLAY_OPTIONS.length - 1);
        const buttonsStartX = panelX + (PAUSE_OVERLAY_PANEL_WIDTH - totalButtonsWidth) / 2;
        const buttonsY = panelY + PAUSE_OVERLAY_OPTIONS_Y_OFFSET;

        for (let i = 0; i < PAUSE_OVERLAY_OPTIONS.length; i++) {
            const option = PAUSE_OVERLAY_OPTIONS[i];
            const bx = buttonsStartX + i * (PAUSE_OVERLAY_OPTION_WIDTH + PAUSE_OVERLAY_OPTION_GAP);
            const by = buttonsY;

            this.pauseMenuButtonRects.push({
                x: bx, y: by,
                w: PAUSE_OVERLAY_OPTION_WIDTH, h: PAUSE_OVERLAY_OPTION_HEIGHT,
                action: option,
            });

            const isActiveControls = option === PAUSE_OPTION_CONTROLS && showPauseControls;
            ctx.fillStyle = isActiveControls ? "#3f6bff" : "rgba(255, 255, 255, 0.14)";
            ctx.fillRect(bx, by, PAUSE_OVERLAY_OPTION_WIDTH, PAUSE_OVERLAY_OPTION_HEIGHT);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(bx, by, PAUSE_OVERLAY_OPTION_WIDTH, PAUSE_OVERLAY_OPTION_HEIGHT);

            ctx.fillStyle = "white";
            ctx.font = '24px "Oxanium", sans-serif';
            ctx.fillText(option, bx + PAUSE_OVERLAY_OPTION_WIDTH / 2, by + PAUSE_OVERLAY_OPTION_HEIGHT / 2);
        }

        if (showPauseControls) {
            const boxX = panelX + PAUSE_OVERLAY_CONTROLS_BOX_MARGIN_X;
            const boxY = panelY + PAUSE_OVERLAY_CONTROLS_BOX_Y_OFFSET;
            const boxW = PAUSE_OVERLAY_PANEL_WIDTH - PAUSE_OVERLAY_CONTROLS_BOX_MARGIN_X * 2;

            ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
            ctx.fillRect(boxX, boxY, boxW, PAUSE_OVERLAY_CONTROLS_BOX_HEIGHT);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
            ctx.strokeRect(boxX, boxY, boxW, PAUSE_OVERLAY_CONTROLS_BOX_HEIGHT);

            ctx.fillStyle = "white";
            ctx.font = '18px "Oxanium", sans-serif';
            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";
            let textY = boxY + PAUSE_OVERLAY_CONTROLS_TEXT_PADDING + 12;
            const textX = boxX + PAUSE_OVERLAY_CONTROLS_TEXT_PADDING;
            for (const line of PAUSE_CONTROLS_LINES) {
                ctx.fillText(line, textX, textY);
                textY += PAUSE_OVERLAY_CONTROLS_LINE_HEIGHT;
            }
        } else {
            ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
            ctx.font = '20px "Oxanium", sans-serif';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(
                "Click Controls to view control details.",
                panelX + PAUSE_OVERLAY_PANEL_WIDTH / 2,
                panelY + PAUSE_OVERLAY_CONTROLS_BOX_Y_OFFSET + 42
            );
        }

        ctx.restore();
    }

    drawDreamStateOverlay(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 350);

        ctx.save();

        // Radial vignette from center to edges
        const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.85);
        vignette.addColorStop(0, "rgba(80, 0, 160, 0)");
        vignette.addColorStop(0.6, `rgba(100, 0, 180, ${0.12 + 0.06 * pulse})`);
        vignette.addColorStop(1, `rgba(160, 0, 255, ${0.45 + 0.15 * pulse})`);
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, w, h);

        // Glowing inner border
        const inset = 6;
        ctx.strokeStyle = `rgba(200, 100, 255, ${0.55 + 0.35 * pulse})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur = 24 + 12 * pulse;
        ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);

        // Softer inner ring
        ctx.strokeStyle = `rgba(230, 160, 255, ${0.2 + 0.2 * pulse})`;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 8;
        ctx.strokeRect(inset + 8, inset + 8, w - (inset + 8) * 2, h - (inset + 8) * 2);

        ctx.restore();
    }

    drawLevelLabel(ctx) {
        if (this.levelLabelTimer <= 0) return;

        const TOTAL = 3.5;
        const FADE_IN = 0.5;
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

        // Accent lines flanking the text
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

        const meter = player.dreamMeter;
        const max = player.dreamMeterMax;
        const active = player.inDreamState;
        const ratio = max > 0 ? Math.min(meter / max, 1) : 0;
        const allFull = ratio >= 1;

        const PIP_COUNT = 7;
        const PIP_HW = 14;
        const PIP_HH = 18;
        const PIP_SPACING = 38;

        // Bottom-left anchor
        const MARGIN_LEFT = 36;
        const MARGIN_BOTTOM = 52;
        const pipCY = ctx.canvas.height - MARGIN_BOTTOM;
        const firstX = MARGIN_LEFT + PIP_HW;
        const labelX = firstX + ((PIP_COUNT - 1) * PIP_SPACING) / 2;

        const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 250);

        ctx.save();

        // Ready state: glowing border around the whole pip group
        if (allFull && !active) {
            const totalW = (PIP_COUNT - 1) * PIP_SPACING + PIP_HW * 2;
            const padX = 14;
            const padY = 12;
            ctx.save();
            ctx.shadowColor = "#c084fc";
            ctx.shadowBlur = 32 + 18 * pulse;
            ctx.strokeStyle = `rgba(210, 140, 255, ${0.5 + 0.4 * pulse})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(
                firstX - PIP_HW - padX,
                pipCY - PIP_HH - padY,
                totalW + padX * 2,
                PIP_HH * 2 + padY * 2
            );
            ctx.restore();
        }

        for (let i = 0; i < PIP_COUNT; i++) {
            const px = firstX + i * PIP_SPACING;
            const pipRatio = Math.min(1, Math.max(0, ratio * PIP_COUNT - i));

            // Empty diamond background
            ctx.beginPath();
            ctx.moveTo(px, pipCY - PIP_HH);
            ctx.lineTo(px + PIP_HW, pipCY);
            ctx.lineTo(px, pipCY + PIP_HH);
            ctx.lineTo(px - PIP_HW, pipCY);
            ctx.closePath();
            ctx.fillStyle = "rgba(60, 20, 100, 0.4)";
            ctx.fill();

            // Filled portion (clipped to diamond)
            if (pipRatio > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(px, pipCY - PIP_HH);
                ctx.lineTo(px + PIP_HW, pipCY);
                ctx.lineTo(px, pipCY + PIP_HH);
                ctx.lineTo(px - PIP_HW, pipCY);
                ctx.closePath();
                ctx.clip();

                const fillTop = pipCY + PIP_HH - pipRatio * PIP_HH * 2;

                if (active) {
                    ctx.fillStyle = "#e879f9";
                } else if (allFull) {
                    const r = Math.round(185 + 50 * pulse);
                    const g = Math.round(80 + 20 * pulse);
                    ctx.fillStyle = `rgb(${r}, ${g}, 255)`;
                } else {
                    const grad = ctx.createLinearGradient(px, pipCY - PIP_HH, px, pipCY + PIP_HH);
                    grad.addColorStop(0, "#c084fc");
                    grad.addColorStop(1, "#7c3aed");
                    ctx.fillStyle = grad;
                }

                ctx.fillRect(px - PIP_HW, fillTop, PIP_HW * 2, PIP_HH * 2);
                ctx.restore();
            }

            // Bloom glow when ready
            if (allFull && !active) {
                ctx.save();
                ctx.globalAlpha = 0.4 * pulse;
                ctx.shadowColor = "#c084fc";
                ctx.shadowBlur = 28;
                ctx.beginPath();
                ctx.moveTo(px, pipCY - PIP_HH);
                ctx.lineTo(px + PIP_HW, pipCY);
                ctx.lineTo(px, pipCY + PIP_HH);
                ctx.lineTo(px - PIP_HW, pipCY);
                ctx.closePath();
                ctx.fillStyle = "#c084fc";
                ctx.fill();
                ctx.restore();
            }

            // Diamond outline
            ctx.beginPath();
            ctx.moveTo(px, pipCY - PIP_HH);
            ctx.lineTo(px + PIP_HW, pipCY);
            ctx.lineTo(px, pipCY + PIP_HH);
            ctx.lineTo(px - PIP_HW, pipCY);
            ctx.closePath();
            if (active) {
                ctx.shadowColor = "#e879f9";
                ctx.shadowBlur = 12;
                ctx.strokeStyle = "rgba(232, 121, 249, 0.95)";
                ctx.lineWidth = 2;
            } else if (allFull) {
                ctx.shadowColor = "#c084fc";
                ctx.shadowBlur = 16 + 8 * pulse;
                ctx.strokeStyle = `rgba(220, 160, 255, ${0.8 + 0.2 * pulse})`;
                ctx.lineWidth = 2;
            } else {
                ctx.shadowBlur = 0;
                ctx.strokeStyle = "rgba(140, 80, 200, 0.6)";
                ctx.lineWidth = 1.5;
            }
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        // Label above pips
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";

        if (active) {
            ctx.font = "bold 13px Orbitron, Arial, sans-serif";
            ctx.shadowColor = "#e879f9";
            ctx.shadowBlur = 12;
            ctx.fillStyle = `rgba(232, 121, 249, ${0.9 + 0.1 * pulse})`;
            ctx.fillText("DREAM ACTIVE", labelX, pipCY - PIP_HH - 6);
        } else if (allFull) {
            ctx.font = "bold 15px Orbitron, Arial, sans-serif";
            ctx.shadowColor = "#c084fc";
            ctx.shadowBlur = 20 + 10 * pulse;
            ctx.fillStyle = `rgb(${Math.round(220 + 35 * pulse)}, ${Math.round(155 + 30 * pulse)}, 255)`;
            ctx.fillText("DREAM  [E]", labelX, pipCY - PIP_HH - 8);
        } else {
            ctx.font = "bold 11px Orbitron, Arial, sans-serif";
            ctx.shadowBlur = 0;
            ctx.fillStyle = "rgba(150, 100, 210, 0.75)";
            ctx.fillText("DREAM", labelX, pipCY - PIP_HH - 6);
        }

        ctx.restore();
    }
}

export default GameUI;
