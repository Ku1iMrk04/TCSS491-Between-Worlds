const OPTIONS = ["Resume", "Restart", "Controls"];
const OPT_CONTROLS = "Controls";

class PauseMenu {
    constructor(game) {
        this.game = game;
        this.hoverScales = OPTIONS.map(() => 0);
        this.hoveredIndex = -1;
        this.buttonRects = [];
    }

    draw(ctx, showControls) {
        const cw = ctx.canvas.width;
        const ch = ctx.canvas.height;
        const cx = cw / 2;

        const panelW = 860;
        const panelH = showControls ? 640 : 420;
        const panelX = cx - panelW / 2;
        const panelY = (ch - panelH) / 2;

        ctx.save();

        // Screen dim
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, cw, ch);

        // Panel
        ctx.fillStyle = "rgba(8,0,22,0.96)";
        ctx.strokeStyle = "rgba(160,100,240,0.55)";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, 12);
        ctx.fill();
        ctx.stroke();

        // Top accent bar
        const bar = ctx.createLinearGradient(panelX, 0, panelX + panelW, 0);
        bar.addColorStop(0,   "rgba(124,58,237,0)");
        bar.addColorStop(0.5, "rgba(192,132,252,0.7)");
        bar.addColorStop(1,   "rgba(124,58,237,0)");
        ctx.fillStyle = bar;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, 3, [12, 12, 0, 0]);
        ctx.fill();

        // Title
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.font = '700 48px "Orbitron", sans-serif';
        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur = 18;
        ctx.fillStyle = "#ffffff";
        ctx.fillText("PAUSED", cx, panelY + 74);
        ctx.shadowBlur = 0;

        // Divider
        const divY = panelY + 92;
        const dg = ctx.createLinearGradient(panelX, 0, panelX + panelW, 0);
        dg.addColorStop(0,   "rgba(124,58,237,0)");
        dg.addColorStop(0.5, "rgba(192,132,252,0.45)");
        dg.addColorStop(1,   "rgba(124,58,237,0)");
        ctx.strokeStyle = dg;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(panelX + 40, divY);
        ctx.lineTo(panelX + panelW - 40, divY);
        ctx.stroke();

        // Buttons
        this.buttonRects = [];
        const btnW = 220;
        const btnH = 54;
        const btnGap = 22;
        const totalW = OPTIONS.length * btnW + (OPTIONS.length - 1) * btnGap;
        const btnsStartX = cx - totalW / 2;
        const btnsY = panelY + 120;

        // Hover detection
        const mouse = this.game.mouse;
        this.hoveredIndex = -1;
        if (mouse) {
            for (let i = 0; i < OPTIONS.length; i++) {
                const bx = btnsStartX + i * (btnW + btnGap);
                if (mouse.x >= bx && mouse.x <= bx + btnW && mouse.y >= btnsY && mouse.y <= btnsY + btnH) {
                    this.hoveredIndex = i;
                }
            }
        }

        for (let i = 0; i < OPTIONS.length; i++) {
            const target = i === this.hoveredIndex ? 1 : 0;
            this.hoverScales[i] += (target - this.hoverScales[i]) * 0.12;
        }

        ctx.font = '26px "Oxanium", sans-serif';
        ctx.textBaseline = "middle";

        for (let i = 0; i < OPTIONS.length; i++) {
            const option = OPTIONS[i];
            const bx = btnsStartX + i * (btnW + btnGap);
            const by = btnsY;
            const t = this.hoverScales[i];
            const isActiveControls = option === OPT_CONTROLS && showControls;

            this.buttonRects.push({ x: bx, y: by, w: btnW, h: btnH, action: option });

            const scale = 1 + t * 0.04;
            ctx.save();
            ctx.translate(bx + btnW / 2, by + btnH / 2);
            ctx.scale(scale, scale);
            ctx.translate(-(bx + btnW / 2), -(by + btnH / 2));

            if (isActiveControls) {
                ctx.fillStyle = "rgba(100,50,200,0.5)";
                ctx.strokeStyle = `rgba(192,132,252,${0.7 + t * 0.3})`;
            } else {
                ctx.fillStyle = `rgba(${20 + Math.round(60 * t)}, 0, ${40 + Math.round(80 * t)}, ${0.08 + t * 0.2})`;
                ctx.strokeStyle = `rgba(${140 + Math.round(52 * t)}, ${Math.round(50 * t)}, ${200 + Math.round(52 * t)}, ${0.3 + t * 0.55})`;
            }
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.roundRect(bx, by, btnW, btnH, 7);
            ctx.fill();
            ctx.stroke();

            if (t > 0.01 || isActiveControls) {
                ctx.shadowColor = "#c084fc";
                ctx.shadowBlur = isActiveControls ? 14 : t * 18;
            }
            ctx.fillStyle = `rgba(255,255,255,${0.7 + t * 0.3})`;
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.textAlign = "center";
            ctx.fillText(option, bx + btnW / 2, by + btnH / 2);
            ctx.restore();
        }

        // Controls section
        if (showControls) {
            this._drawControls(ctx, panelX, panelW, btnsY + btnH + 30);
        }

        ctx.restore();
    }

    _drawControls(ctx, panelX, panelW, boxY) {
        const boxX = panelX + 40;
        const boxW = panelW - 80;

        ctx.fillStyle = "rgba(40,0,70,0.3)";
        ctx.strokeStyle = "rgba(160,100,240,0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, 220, 8);
        ctx.fill();
        ctx.stroke();

        const col1 = boxX + 28;
        const col2 = boxX + boxW / 2 + 20;
        let cy1 = boxY + 44;
        let cy2 = boxY + 44;
        const rowH = 36;

        const controls = [
            ["WASD / Arrows",       "Move"],
            ["Space",               "Jump"],
            ["Left Shift",          "Roll"],
            ["Left Click",          "Attack"],
            ["E",                   "Dream State"],
            ["Left Click (Dream)",  "Dream Slash"],
        ];

        ctx.textBaseline = "alphabetic";
        for (let i = 0; i < controls.length; i++) {
            const [key, desc] = controls[i];
            const isLeft = i < Math.ceil(controls.length / 2);
            const tx = isLeft ? col1 : col2;
            const ty = isLeft ? cy1 : cy2;

            ctx.font = '600 19px "Oxanium", sans-serif';
            ctx.fillStyle = "rgba(232,121,249,0.9)";
            ctx.textAlign = "left";
            ctx.fillText(key, tx, ty);
            const kw = ctx.measureText(key).width + 10;
            ctx.font = '19px "Oxanium", sans-serif';
            ctx.fillStyle = "rgba(255,255,255,0.68)";
            ctx.fillText(`— ${desc}`, tx + kw, ty);

            if (isLeft) cy1 += rowH; else cy2 += rowH;
        }
    }
}

export default PauseMenu;
