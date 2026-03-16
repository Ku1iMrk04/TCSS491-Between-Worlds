/**
 * Draws the full-screen overlay shell (backdrop, accent bars, close button, ESC hint)
 * and delegates to the correct content renderer based on overlayType.
 *
 * Returns the close button rect so the caller can handle click detection.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w - canvas width
 * @param {number} h - canvas height
 * @param {"howtoplay"|"credits"|"gamecredits"} overlayType
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

    if (overlayType === "howtoplay") {
        _drawHowToPlay(ctx, w, h);
    } else if (overlayType === "credits") {
        _drawCredits(ctx, w, h);
    } else if (overlayType === "gamecredits") {
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

// ─── How to Play ─────────────────────────────────────────────────────────────

function _drawHowToPlay(ctx, w, h) {
    ctx.save();
    ctx.textAlign = "center";

    // Header
    ctx.font = '700 52px "Orbitron", sans-serif';
    ctx.shadowColor = "#c084fc";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#ffffff";
    ctx.fillText("HOW TO PLAY", w / 2, 118);
    ctx.shadowBlur = 0;

    _divider(ctx, w, 142);

    const col1X = w / 2 - 440;
    const col2X = w / 2 + 60;
    const secGap = 46;
    const rowH   = 38;

    // ── Left column ──
    let y1 = 210;
    _sectionHeader(ctx, "MOVEMENT", col1X, y1); y1 += secGap;
    _controlRow(ctx, col1X, y1, "WASD / Arrow Keys", "Move");        y1 += rowH;
    _controlRow(ctx, col1X, y1, "Space",              "Jump");        y1 += rowH;
    _controlRow(ctx, col1X, y1, "Left Shift",         "Roll / Dodge"); y1 += rowH;

    y1 += 24;
    _sectionHeader(ctx, "COMBAT", col1X, y1); y1 += secGap;
    _controlRow(ctx, col1X, y1, "Left Click", "Attack");                y1 += rowH;
    _controlRow(ctx, col1X, y1, "Roll",        "Pass through enemies"); y1 += rowH;

    // ── Right column ──
    let y2 = 210;
    _sectionHeader(ctx, "DREAM STATE", col2X, y2); y2 += secGap;
    _controlRow(ctx, col2X, y2, "E",           "Activate Dream State");       y2 += rowH;
    _controlRow(ctx, col2X, y2, "Left Click",  "Dream Slash toward cursor");  y2 += rowH;

    y2 += 28;
    // Description box
    const descBoxX = col2X;
    const descBoxW = 420;
    const descLines = [
        "Hit enemies to charge the DREAM meter.",
        "When full, press E to enter Dream State:",
        "  · 1.5x movement speed",
        "  · Powerful directional Dream Slash (300px)",
    ];
    const descBoxH = descLines.length * 30 + 28;

    ctx.fillStyle   = "rgba(80,0,120,0.22)";
    ctx.strokeStyle = "rgba(192,132,252,0.3)";
    ctx.lineWidth   = 1.2;
    ctx.beginPath();
    ctx.roundRect(descBoxX - 12, y2 - 14, descBoxW, descBoxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.font      = '18px "Oxanium", sans-serif';
    ctx.fillStyle = "rgba(192,132,252,0.9)";
    for (const line of descLines) {
        ctx.fillText(line, descBoxX, y2);
        y2 += 30;
    }

    // Goal bar
    const goalY = h - 130;
    _divider(ctx, w, goalY);
    ctx.textAlign   = "center";
    ctx.font        = '22px "Oxanium", sans-serif';
    ctx.fillStyle   = "rgba(255,255,255,0.75)";
    ctx.shadowColor = "#c084fc";
    ctx.shadowBlur  = 6;
    ctx.fillText("GOAL  —  Defeat all enemies in each level to escape the dream world", w / 2, goalY + 48);
    ctx.shadowBlur = 0;

    ctx.restore();
}

// ─── Credits ─────────────────────────────────────────────────────────────────

function _drawCredits(ctx, w, h) {
    ctx.save();
    ctx.textAlign = "center";

    // Header
    ctx.font        = '700 52px "Orbitron", sans-serif';
    ctx.shadowColor = "#c084fc";
    ctx.shadowBlur  = 20;
    ctx.fillStyle   = "#ffffff";
    ctx.fillText("CREDITS", w / 2, 118);
    ctx.shadowBlur = 0;

    _divider(ctx, w, 142);

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

        ctx.shadowColor = "#7c3aed";
        ctx.shadowBlur  = 14;
        ctx.fillStyle   = "rgba(50,0,90,0.35)";
        ctx.strokeStyle = "rgba(192,132,252,0.38)";
        ctx.lineWidth   = 1.5;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 10);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.stroke();

        // Left accent stripe
        const stripe = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardH);
        stripe.addColorStop(0, "#7c3aed");
        stripe.addColorStop(1, "#e879f9");
        ctx.fillStyle = stripe;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, 4, cardH, [10, 0, 0, 10]);
        ctx.fill();

        // Name
        ctx.textAlign   = "center";
        ctx.font        = '600 30px "Oxanium", sans-serif';
        ctx.fillStyle   = "#ffffff";
        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur  = 8;
        ctx.fillText(m.name, w / 2, cardY + 44);
        ctx.shadowBlur = 0;

        // Role
        ctx.font      = '20px "Oxanium", sans-serif';
        ctx.fillStyle = "rgba(192,132,252,0.85)";
        ctx.fillText(m.role, w / 2, cardY + 78);

        cardY += cardH + gap;
    }

    // Footer tag
    ctx.font      = '16px "Orbitron", sans-serif';
    ctx.fillStyle = "rgba(192,132,252,0.4)";
    ctx.textAlign = "center";
    ctx.fillText("Between Worlds  ·  TCSS 491  ·  2025", w / 2, h - 56);

    ctx.restore();
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

function _sectionHeader(ctx, text, x, y) {
    ctx.textAlign   = "left";
    ctx.font        = '700 18px "Orbitron", sans-serif';
    ctx.fillStyle   = "#c084fc";
    ctx.shadowColor = "#9333ea";
    ctx.shadowBlur  = 8;
    ctx.fillText(text, x, y);
    ctx.shadowBlur = 0;
}

function _controlRow(ctx, x, y, key, desc) {
    ctx.textAlign = "left";
    ctx.font      = '600 22px "Oxanium", sans-serif';
    ctx.fillStyle = "rgba(232,121,249,0.9)";
    ctx.fillText(key, x, y);
    const kw = ctx.measureText(key).width + 14;
    ctx.font      = '22px "Oxanium", sans-serif';
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.fillText(`— ${desc}`, x + kw, y);
}

function _divider(ctx, w, y) {
    const g = ctx.createLinearGradient(0, y, w, y);
    g.addColorStop(0,   "rgba(124,58,237,0)");
    g.addColorStop(0.5, "rgba(192,132,252,0.5)");
    g.addColorStop(1,   "rgba(124,58,237,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.08, y);
    ctx.lineTo(w * 0.92, y);
    ctx.stroke();
}

function _dividerGreen(ctx, w, y) {
    const g = ctx.createLinearGradient(0, y, w, y);
    g.addColorStop(0,   "rgba(5,150,105,0)");
    g.addColorStop(0.5, "rgba(16,185,129,0.5)");
    g.addColorStop(1,   "rgba(5,150,105,0)");
    ctx.strokeStyle = g;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.08, y);
    ctx.lineTo(w * 0.92, y);
    ctx.stroke();
}

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
