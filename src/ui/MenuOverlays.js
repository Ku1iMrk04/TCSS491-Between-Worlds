/**
 * Draws the full-screen overlay shell (backdrop, accent bars, close button, ESC hint)
 * and delegates to the correct content renderer based on overlayType.
 *
 * Returns the close button rect so the caller can handle click detection.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w - canvas width
 * @param {number} h - canvas height
 * @param {"gamecredits"} overlayType
 * @returns {{ x, y, w, h }} closeBtnRect
 */
export function drawOverlay(ctx, w, h, overlayType) {
    const isBlue = overlayType === "gamecredits";

    // Backdrop
    ctx.fillStyle = isBlue ? "rgba(4,0,10,0.92)" : "rgba(4,0,12,0.92)";
    ctx.fillRect(0, 0, w, h);

    // Top accent bar
    _accentBar(ctx, w, 0, isBlue ? "rgba(59,130,246,0.9)" : "rgba(192,132,252,0.9)");
    // Bottom accent bar
    _accentBar(ctx, w, h - 3, isBlue ? "rgba(59,130,246,0.5)" : "rgba(192,132,252,0.5)");

    if (overlayType === "gamecredits") {
        _drawGameCredits(ctx, w, h);
    }

    // Close button (top-right)
    const bS = 48, bX = w - 72, bY = 36;

    ctx.save();
    ctx.strokeStyle = isBlue ? "rgba(59,130,246,0.65)" : "rgba(192,132,252,0.65)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(bX, bY, bS, bS, 6);
    ctx.stroke();

    const pad = 14;
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(bX + pad,      bY + pad);
    ctx.lineTo(bX + bS - pad, bY + bS - pad);
    ctx.moveTo(bX + bS - pad, bY + pad);
    ctx.lineTo(bX + pad,      bY + bS - pad);
    ctx.stroke();
    ctx.restore();

    // ESC hint
    ctx.save();
    ctx.fillStyle = isBlue ? "rgba(59,130,246,0.45)" : "rgba(192,132,252,0.45)";
    ctx.font = '14px "Oxanium", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText("ESC to close", w / 2, h - 18);
    ctx.restore();

    return { x: bX, y: bY, w: bS, h: bS };
}

// ─── Game Credits (Blue Theme) ───────────────────────────────────────────────

function _drawGameCredits(ctx, w, h) {
    ctx.save();
    ctx.textAlign = "center";

    // Header
    ctx.font        = '700 52px "Orbitron", sans-serif';
    ctx.shadowColor = "#3b82f6";
    ctx.shadowBlur  = 20;
    ctx.fillStyle   = "#ffffff";
    ctx.fillText("CREDITS", w / 2, 118);
    ctx.shadowBlur = 0;

    _dividerBlue(ctx, w, 142);

    const members = [
        { name: "Buruk Yimesgen",  role: "Developer" },
        { name: "Mark Kulibaba",   role: "Developer" },
        { name: "Evan Tran",       role: "Developer" },
        { name: "Patrick Quaidoo", role: "Developer" },
    ];

    const cardW   = 520;
    const cardH   = 108;
    const gap     = 26;
    const totalH  = members.length * (cardH + gap) - gap;
    let cardY = (h - totalH) / 2 + 20;

    for (const m of members) {
        const cardX = w / 2 - cardW / 2;

        ctx.shadowColor = "#1e40af";
        ctx.shadowBlur  = 14;
        ctx.fillStyle   = "rgba(0,20,50,0.35)";
        ctx.strokeStyle = "rgba(59,130,246,0.38)";
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 10);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.stroke();

        // Left accent stripe
        const stripe = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
        stripe.addColorStop(0, "#2563eb");
        stripe.addColorStop(1, "#60a5fa");
        ctx.fillStyle = stripe;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, 4, cardH, [10, 0, 0, 10]);
        ctx.fill();

        // Name
        ctx.textAlign   = "center";
        ctx.font        = '600 30px "Oxanium", sans-serif';
        ctx.fillStyle   = "#ffffff";
        ctx.shadowColor = "#3b82f6";
        ctx.shadowBlur  = 8;
        ctx.fillText(m.name, w / 2, cardY + 44);
        ctx.shadowBlur = 0;

        // Role
        ctx.font      = '20px "Oxanium", sans-serif';
        ctx.fillStyle = "rgba(147,197,253,0.85)";
        ctx.fillText(m.role, w / 2, cardY + 78);

        cardY += cardH + gap;
    }

    // Footer tag
    ctx.font      = '16px "Orbitron", sans-serif';
    ctx.fillStyle = "rgba(59,130,246,0.4)";
    ctx.textAlign = "center";
    ctx.fillText("Between Worlds  ·  TCSS 491  ·  2025", w / 2, h - 56);

    ctx.restore();
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function _dividerBlue(ctx, w, y) {
    const g = ctx.createLinearGradient(0, y, w, y);
    g.addColorStop(0,   "rgba(37,99,235,0)");
    g.addColorStop(0.5, "rgba(59,130,246,0.5)");
    g.addColorStop(1,   "rgba(37,99,235,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.08, y);
    ctx.lineTo(w * 0.92, y);
    ctx.stroke();
}

function _accentBar(ctx, w, y, color) {
    const g = ctx.createLinearGradient(0, y, w, y);
    g.addColorStop(0,   "rgba(124,58,237,0)");
    g.addColorStop(0.5, color);
    g.addColorStop(1,   "rgba(124,58,237,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, y, w, 3);
}
