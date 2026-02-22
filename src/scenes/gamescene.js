import Scene from "./scene.js";
import Player from "../actors/player.js";
import Enemy from "../actors/enemy.js";
import GruntEnemy from "../actors/gruntenemy.js";
import ScientistEnemy from "../actors/scientistenemy.js";
import GangsterEnemy from "../actors/gangsterenemy.js";
import DeathScene from "./deathscene.js";
import MenuScene from "./menuscene.js";
import Camera from "../camera.js";


class GameScene extends Scene {
    constructor(game, levelBgImage ) {
        super(game);
        this.isGameplay = true;
        this.levelBgImage = levelBgImage;

        this.player = null;
    }

    enter() {
        // reset entities for a clean run
        this.game.entities = [];

        const tileMap = this.game.tileMap;

        // Initialize camera based on map size
        // Viewport size is 960x540 (the scaled-down canvas size)
        const viewportWidth = 960;
        const viewportHeight = 540;
        const worldWidth = tileMap.width * tileMap.tileWidth;
        const worldHeight = tileMap.height * tileMap.tileHeight;

        this.game.camera = new Camera(viewportWidth, viewportHeight, worldWidth, worldHeight);

        // Spawn player from map data
        const playerSpawn = tileMap.getPlayerSpawn();
        if (playerSpawn) {
            this.player = new Player(this.game, playerSpawn.x, playerSpawn.y);
        } else {
            // Fallback if no spawn point defined
            this.player = new Player(this.game, 300, 750);
        }
        this.game.addEntity(this.player);

        // Set camera to follow player
        this.game.camera.follow(this.player);

        // Spawn enemies from map data
        const enemySpawns = tileMap.getEnemySpawns();
        for (const spawn of enemySpawns) {
            let enemy;
            if (spawn.type === "grunt") {
                enemy = new GruntEnemy(this.game, spawn.x, spawn.y);
            } else if (spawn.type === "gangster") {
                enemy = new GangsterEnemy(this.game, spawn.x, spawn.y);
            } else if (spawn.type === "scientist") {
                enemy = new ScientistEnemy(this.game, spawn.x, spawn.y);
            } else {
                enemy = new Enemy(this.game, spawn.x, spawn.y);
            }
            this.game.addEntity(enemy);
        }
    }

    onKeyDown(event) {
        if (event.code === "KeyR") {
            const menuBg = this.game.menuBgImage;
            this.game.sceneManager.changeScene(new MenuScene(this.game, menuBg, this.levelBgImage));
        }
    }

    update() {
        // If player is removed (dies), go to death scene
        if (this.player && this.player.removeFromWorld) {
            this.game.sceneManager.changeScene(new DeathScene(this.game, this.levelBgImage));
        }
    }

    draw(ctx) {
        // Disable anti-aliasing for game scene
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;

        // Scale factor: canvas is 1920x1080, viewport is 960x540
        const scale = 2;

        ctx.save();
        ctx.scale(scale, scale);

        // Apply camera transform
        if (this.game.camera) {
            this.game.camera.applyTransform(ctx);
        }

        // Draw tilemap background layer first
        if (this.game.tileMap) {
            this.game.tileMap.drawBackground(ctx);
        }

        // Draw tilemap foreground layer (platforms/collision tiles)
        if (this.game.tileMap) {
            this.game.tileMap.drawForeground(ctx);
        }

        // Draw tilemap collision debug (red tiles show solid areas, green shows slopes)
        if (this.game.tileMap) {
            this.game.tileMap.drawDebug(ctx);
        }

        ctx.restore();

        // Then draw HUD on top (not scaled, not affected by camera)
        this.drawLevelLabel(ctx);
        this.drawControlsHub(ctx);
        this.drawPlayerHealthBar(ctx);
        this.drawDashStrikeCooldown(ctx);
    }

    drawLevelLabel(ctx) {
        const text = "Level 1";

        ctx.save();
        ctx.fillStyle = "white";
        ctx.font = "66px Orbitron, Arial, sans-serif";
        ctx.textBaseline = "top";

        const textWidth = ctx.measureText(text).width;
        const x = (ctx.canvas.width - textWidth) / 2;
        const y = 36;

        ctx.fillText(text, x, y);
        ctx.restore();
    }

    drawControlsHub(ctx) {
        const lineHeight = 40
        const boxW = 520;
        const boxH = 240;
        const x = ctx.canvas.width - boxW - 32;
        const y = 32;
        const pad = 20;

        ctx.save();

        // faint gray panel
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = "#e0e0e0";
        ctx.fillRect(x, y, boxW, boxH);

        // border
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#b0b0b0";
        ctx.strokeRect(x, y, boxW, boxH);

        // text
        ctx.fillStyle = "#333";
        ctx.font = "28px Arial";
        ctx.textBaseline = "top";
        ctx.fillText("Controls:", x + pad, y + pad);
        ctx.fillText("Move: WASD / Arrow Keys", x + pad, y + pad + lineHeight);
        ctx.fillText("Attack: Left Click", x + pad, y + pad + (lineHeight * 2));
        ctx.fillText("Roll: Left Shift", x + pad, y + pad + (lineHeight * 3));
        ctx.fillText("Dash Strike: Right Click", x + pad, y + pad + (lineHeight * 4));

        ctx.restore();
    }

    drawPlayerHealthBar(ctx) {
        if (!this.player) return;

        const maxHp = this.player.maxHealth ?? 50;
        const hp = Math.max(0, Math.min(this.player.health ?? maxHp, maxHp));

        const x = 48;
        const y = 132;
        const w = 660;
        const h = 54;

        // 50 green, 40 lime, 30 yellow, 20 orange, 10 red
        let color = "green";
        if (hp <= 10) color = "red";
        else if (hp <= 20) color = "orange";
        else if (hp <= 30) color = "yellow";
        else if (hp <= 40) color = "lime";

        const ratio = maxHp > 0 ? hp / maxHp : 0;
        const fillW = Math.floor(w * ratio);

        ctx.save();

        // label with gray background box
        ctx.fillStyle = "#333";
        ctx.font = "42px Arial";
        ctx.textBaseline = "bottom";
        ctx.fillText(`HP: ${hp}/${maxHp}`, x, y - 12);

        // bar background
        ctx.fillStyle = "#444";
        ctx.fillRect(x, y, w, h);

        // single bar shrink
        ctx.fillStyle = color;
        ctx.fillRect(x, y, fillW, h);

        // border
        ctx.strokeStyle = "#111";
        ctx.strokeRect(x, y, w, h);

        ctx.restore();
    }
    drawDashStrikeCooldown(ctx) {
        if (!this.player) return;

        const cooldown = this.player.dashStrikeCooldown;
        const timer = Math.max(0, this.player.dashStrikeCooldownTimer);
        const ready = timer <= 0;

        const x = 48;
        const y = 210;
        const size = 60;

        ctx.save();

        // Label
        ctx.fillStyle = "#ccc";
        ctx.font = "28px Arial";
        ctx.textBaseline = "top";
        ctx.fillText("Dash Strike", x, y);

        // Icon box background
        const iconX = x;
        const iconY = y + 36;
        ctx.fillStyle = ready ? "#2ecc71" : "#444";
        ctx.fillRect(iconX, iconY, size, size);

        if (!ready) {
            // Shrinking cooldown overlay
            const ratio = timer / cooldown;
            const overlayHeight = Math.floor(size * ratio);
            ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            ctx.fillRect(iconX, iconY, size, overlayHeight);

            // Remaining seconds
            ctx.fillStyle = "#fff";
            ctx.font = "24px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(timer.toFixed(1), iconX + size / 2, iconY + size / 2);
        } else {
            // "RMB" label when ready
            ctx.fillStyle = "#fff";
            ctx.font = "20px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("RMB", iconX + size / 2, iconY + size / 2);
        }

        // Border
        ctx.strokeStyle = ready ? "#27ae60" : "#666";
        ctx.lineWidth = 2;
        ctx.strokeRect(iconX, iconY, size, size);

        ctx.restore();
    }
}

export default GameScene;
