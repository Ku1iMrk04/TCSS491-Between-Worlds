import Scene from "./scene.js";
import GameScene from "./gamescene.js";

class MenuScene extends Scene {
    constructor(game, menuBgImage, levelBgImage) {
        super(game);
        this.menuBgImage = menuBgImage;
        this.levelBgImage = levelBgImage;
        this.options = ["Start Game", "Manual"];
        this.selectedIndex = 0;

        this.showManual = false;
        this.buttonRects = [];
        this.hoveredIndex = -1;
        this.hoverScales = this.options.map(() => 0); // 0 = normal, 1 = fully hovered
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

            this.game.sceneManager.changeScene(new GameScene(this.game, this.levelBgImage));
        } else {
            this.showManual = !this.showManual;
        }
    }

    draw(ctx) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        const centerX = w / 2;

        // Background image
        if (this.menuBgImage) {
            ctx.drawImage(this.menuBgImage, 0, 0, w, h);
        } else {
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, w, h);
        }

        // Dark overlay for readability
        ctx.fillStyle = "rgba(0,0,0,0.35)";
        ctx.fillRect(0, 0, w, h);

        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";

        // Title
        ctx.fillStyle = "white";
        ctx.font = '64px "Orbitron", sans-serif';
        ctx.fillText("BETWEEN WORLDS", centerX, h / 2 - 120);

        // Menu options
        ctx.font = '36px "Oxanium", sans-serif';
        const startY = h / 2 - 20;
        const lineH = 80;
        const btnW = 360;
        const btnH = 60;

        this.buttonRects = [];

        // Detect which button the mouse is hovering over
        const mouse = this.game.mouse;
        this.hoveredIndex = -1;
        if (mouse) {
            const mx = mouse.x;
            const my = mouse.y;
            for (let i = 0; i < this.options.length; i++) {
                const y = startY + i * lineH;
                const bx = centerX - btnW / 2;
                const by = y - btnH / 2 - 8;
                if (mx >= bx && mx <= bx + btnW && my >= by && my <= by + btnH) {
                    this.hoveredIndex = i;
                    this.selectedIndex = i;
                }
            }
        }

        // Animate hover scales smoothly
        const speed = 0.1;
        for (let i = 0; i < this.options.length; i++) {
            const target = (i === this.hoveredIndex || i === this.selectedIndex) ? 1 : 0;
            this.hoverScales[i] += (target - this.hoverScales[i]) * speed;
        }

        for (let i = 0; i < this.options.length; i++) {
            const y = startY + i * lineH;
            const btnX = centerX - btnW / 2;
            const btnY = y - btnH / 2 - 8;
            const t = this.hoverScales[i];
            const isHovered = i === this.hoveredIndex;
            const isSelected = i === this.selectedIndex;

            // Smooth scale: grows slightly on hover
            const scale = 1 + t * 0.06;

            ctx.save();
            ctx.translate(centerX, btnY + btnH / 2);
            ctx.scale(scale, scale);
            ctx.translate(-centerX, -(btnY + btnH / 2));

            // Button background with animated opacity
            const bgAlpha = 0.08 + t * 0.14;
            const borderAlpha = 0.3 + t * 0.5;
            ctx.fillStyle = `rgba(255,255,255,${bgAlpha})`;
            ctx.strokeStyle = `rgba(255,255,255,${borderAlpha})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(btnX, btnY, btnW, btnH, 8);
            ctx.fill();
            ctx.stroke();

            // Glow effect on hover
            if (t > 0.01) {
                ctx.shadowColor = "rgba(255,255,255," + (t * 0.4) + ")";
                ctx.shadowBlur = t * 15;
            }

            // Draw text with animated opacity
            const textAlpha = 0.65 + t * 0.35;
            ctx.fillStyle = `rgba(255,255,255,${textAlpha})`;
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.fillText(this.options[i], centerX, y);

            ctx.restore();

            this.buttonRects.push({ x: btnX, y: btnY, w: btnW, h: btnH });
        }

        // Manual display
        
        if (this.showManual) {
            // Box size
            const boxW = 700;              
            const boxH = 220;
            const boxX = (w - boxW) / 2;   
            const boxY = (h - boxH) / 2;   

            // Draw box
            ctx.fillStyle = "rgba(0,0,0,0.65)";
            ctx.fillRect(boxX, boxY, boxW, boxH);

            // Text settings
            ctx.fillStyle = "white";
            ctx.font = '18px "Oxanium", sans-serif';

            // Left align *inside* the box with padding
            const pad = 28;
            const textX = boxX + pad;
            let y = boxY + 40;
            const lineH = 34;

            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";

            ctx.fillText("Manual (placeholder)", textX, y); y += lineH;
            ctx.fillText("-Player: 50 hp, Hit enemy twice to kill | Enemy: 40hp, 5 hits to defeat Player ", textX, y); y += lineH;

            ctx.fillText("- Gameplay controls: Use arrow keys to move, space bar to attack,", textX, y); y += lineH;
            ctx.fillText("  more features coming soon.", textX, y); y += lineH;

            ctx.fillText("- Dream World / map features coming soon", textX, y); y += lineH

            ctx.fillText("- Goal: You must defeat all enemies and survive to escape the dream world!", textX, y);
        }
        // Footer
        ctx.save();
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.font = '16px "Oxanium", sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText("Use ↑ ↓ and Enter, OR Click", w / 2, h - 40);
        ctx.restore();  

        ctx.textAlign = "left";
    }
}

export default MenuScene;