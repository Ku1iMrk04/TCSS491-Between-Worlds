import Scene from "./scene.js";
import Player from "../actors/player.js";
import Enemy from "../actors/enemy.js";
import GruntEnemy from "../actors/gruntenemy.js";
import ScientistEnemy from "../actors/scientistenemy.js";
import GangsterEnemy from "../actors/gangsterenemy.js";
import DeathScene from "./deathscene.js";
import LevelCompleteScene from "./levelcompletescene.js";
import MenuScene from "./menuscene.js";
import Camera from "../camera.js";

const ENEMY_COLLISION_LAYER = "enemy";
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
    "Dash Strike: Right Click"
];


class GameScene extends Scene {
    constructor(game, levelBgImage ) {
        super(game);
        this.isGameplay = true;
        this.levelBgImage = levelBgImage;

        this.player = null;
        this.levelCompleteTriggered = false;
        this.isPaused = false;
        this.showPauseControls = false;
        this.pauseMenuButtonRects = [];
        this.pauseButtonRect = null;
    }

    enter() {
        // reset entities for a clean run
        this.game.entities = [];
        this.levelCompleteTriggered = false;
        this.isPaused = false;
        this.showPauseControls = false;
        this.pauseMenuButtonRects = [];

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

    onClick(x, y) {
        const pauseButtonRect = this.getPauseButtonRect();

        if (this.isPaused) {
            // Consume clicks while paused so gameplay attack input is not queued.
            this.game.click = null;

            if (pauseButtonRect && this.isPointInsideRect(x, y, pauseButtonRect)) {
                return;
            }

            for (const button of this.pauseMenuButtonRects) {
                if (this.isPointInsideRect(x, y, button)) {
                    this.handlePauseOption(button.action);
                    return;
                }
            }
            return;
        }

        if (pauseButtonRect && this.isPointInsideRect(x, y, pauseButtonRect)) {
            this.pauseGameplay();
            this.game.click = null;
        }
    }

    update() {
        if (this.isPaused) {
            return;
        }

        if (this.levelCompleteTriggered) {
            return;
        }

        // If player is removed (dies), go to death scene
        if (this.player && this.player.removeFromWorld) {
            this.game.sceneManager.changeScene(new DeathScene(this.game, this.levelBgImage));
            return;
        }

        // Level complete condition: all enemies are gone.
        if (this.getAliveEnemyCount() === 0) {
            this.levelCompleteTriggered = true;
            this.game.sceneManager.changeScene(new LevelCompleteScene(
                this.game,
                this.levelBgImage,
                () => new GameScene(this.game, this.levelBgImage),
                () => new MenuScene(this.game, this.game.menuBgImage, this.levelBgImage)
            ));
        }
    }

    getAliveEnemyCount() {
        return this.game.entities.filter(entity =>
            entity &&
            entity.collider &&
            entity.collider.layer === ENEMY_COLLISION_LAYER &&
            !entity.removeFromWorld
        ).length;
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

        // Dream state background overlay (drawn behind tilemap in world space)
        if (this.player && this.player.inDreamState) {
            // TODO: Replace with actual dream dimension tilemap/art
            ctx.save();
            ctx.fillStyle = "rgba(100, 0, 150, 0.15)";
            const cam = this.game.camera;
            ctx.fillRect(cam.x, cam.y, cam.viewportWidth, cam.viewportHeight);
            ctx.restore();
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
        this.drawPlayerHealthBar(ctx);
        this.drawDashStrikeCooldown(ctx);
        this.drawDreamMeter(ctx);
    }

    drawOverlay(ctx) {
        this.drawPauseButton(ctx);

        if (this.isPaused) {
            this.drawPauseOverlay(ctx);
        }
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
        const lineWidth = rect.w - (PAUSE_BUTTON_LINE_INSET_X * 2);
        for (let i = 0; i < 3; i++) {
            const lineY = rect.y + PAUSE_BUTTON_LINE_START_Y + (i * PAUSE_BUTTON_LINE_GAP);
            ctx.fillRect(rect.x + PAUSE_BUTTON_LINE_INSET_X, lineY, lineWidth, PAUSE_BUTTON_LINE_THICKNESS);
        }
        ctx.restore();
    }

    drawPauseOverlay(ctx) {
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
        ctx.fillText("Paused", panelX + (PAUSE_OVERLAY_PANEL_WIDTH / 2), panelY + PAUSE_OVERLAY_TITLE_Y_OFFSET);

        this.pauseMenuButtonRects = [];
        const totalButtonsWidth = (PAUSE_OVERLAY_OPTION_WIDTH * PAUSE_OVERLAY_OPTIONS.length) +
            (PAUSE_OVERLAY_OPTION_GAP * (PAUSE_OVERLAY_OPTIONS.length - 1));
        const buttonsStartX = panelX + ((PAUSE_OVERLAY_PANEL_WIDTH - totalButtonsWidth) / 2);
        const buttonsY = panelY + PAUSE_OVERLAY_OPTIONS_Y_OFFSET;

        for (let i = 0; i < PAUSE_OVERLAY_OPTIONS.length; i++) {
            const option = PAUSE_OVERLAY_OPTIONS[i];
            const bx = buttonsStartX + (i * (PAUSE_OVERLAY_OPTION_WIDTH + PAUSE_OVERLAY_OPTION_GAP));
            const by = buttonsY;
            const buttonRect = {
                x: bx,
                y: by,
                w: PAUSE_OVERLAY_OPTION_WIDTH,
                h: PAUSE_OVERLAY_OPTION_HEIGHT,
                action: option
            };
            this.pauseMenuButtonRects.push(buttonRect);

            const isActiveControlsButton = option === PAUSE_OPTION_CONTROLS && this.showPauseControls;
            ctx.fillStyle = isActiveControlsButton ? "#3f6bff" : "rgba(255, 255, 255, 0.14)";
            ctx.fillRect(bx, by, PAUSE_OVERLAY_OPTION_WIDTH, PAUSE_OVERLAY_OPTION_HEIGHT);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(bx, by, PAUSE_OVERLAY_OPTION_WIDTH, PAUSE_OVERLAY_OPTION_HEIGHT);

            ctx.fillStyle = "white";
            ctx.font = '24px "Oxanium", sans-serif';
            ctx.fillText(option, bx + (PAUSE_OVERLAY_OPTION_WIDTH / 2), by + (PAUSE_OVERLAY_OPTION_HEIGHT / 2));
        }

        if (this.showPauseControls) {
            const controlsBoxX = panelX + PAUSE_OVERLAY_CONTROLS_BOX_MARGIN_X;
            const controlsBoxY = panelY + PAUSE_OVERLAY_CONTROLS_BOX_Y_OFFSET;
            const controlsBoxW = PAUSE_OVERLAY_PANEL_WIDTH - (PAUSE_OVERLAY_CONTROLS_BOX_MARGIN_X * 2);

            ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
            ctx.fillRect(controlsBoxX, controlsBoxY, controlsBoxW, PAUSE_OVERLAY_CONTROLS_BOX_HEIGHT);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
            ctx.strokeRect(controlsBoxX, controlsBoxY, controlsBoxW, PAUSE_OVERLAY_CONTROLS_BOX_HEIGHT);

            ctx.fillStyle = "white";
            ctx.font = '18px "Oxanium", sans-serif';
            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";

            let textY = controlsBoxY + PAUSE_OVERLAY_CONTROLS_TEXT_PADDING + 12;
            const textX = controlsBoxX + PAUSE_OVERLAY_CONTROLS_TEXT_PADDING;
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
                panelX + (PAUSE_OVERLAY_PANEL_WIDTH / 2),
                panelY + PAUSE_OVERLAY_CONTROLS_BOX_Y_OFFSET + 42
            );
        }

        ctx.restore();
    }

    getPauseButtonRect() {
        const canvas = this.game?.ctx?.canvas;
        if (!canvas) return null;

        return {
            x: canvas.width - PAUSE_BUTTON_SIZE - PAUSE_BUTTON_MARGIN_RIGHT,
            y: PAUSE_BUTTON_MARGIN_TOP,
            w: PAUSE_BUTTON_SIZE,
            h: PAUSE_BUTTON_SIZE
        };
    }

    isPointInsideRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
    }

    handlePauseOption(action) {
        if (action === PAUSE_OPTION_RESUME) {
            this.resumeGameplay();
            return;
        }

        if (action === PAUSE_OPTION_RESTART) {
            this.game.sceneManager.changeScene(new GameScene(this.game, this.levelBgImage));
            return;
        }

        if (action === PAUSE_OPTION_CONTROLS) {
            this.showPauseControls = !this.showPauseControls;
        }
    }

    pauseGameplay() {
        if (this.isPaused) return;

        this.isPaused = true;
        this.showPauseControls = false;
        this.game.click = null;
        this.game.rightclick = null;
    }

    resumeGameplay() {
        if (!this.isPaused) return;

        this.isPaused = false;
        this.showPauseControls = false;
        this.game.click = null;
        this.game.rightclick = null;
    drawDreamMeter(ctx) {
        if (!this.player) return;

        const meter = this.player.dreamMeter;
        const max = this.player.dreamMeterMax;
        const active = this.player.inDreamState;

        const x = 48;
        const y = 320;
        const w = 660;
        const h = 36;

        const ratio = max > 0 ? Math.min(meter / max, 1) : 0;
        const fillW = Math.floor(w * ratio);

        ctx.save();

        // Label
        ctx.fillStyle = active ? "#c77dff" : "#aaa";
        ctx.font = "36px Arial";
        ctx.textBaseline = "bottom";
        ctx.fillText(active ? "DREAM ACTIVE" : "Dream", x, y - 8);

        // "Press E" hint when full and not active
        if (!active && ratio >= 1) {
            ctx.fillStyle = "#c77dff";
            ctx.font = "28px Arial";
            ctx.fillText("  [E]", x + ctx.measureText("Dream").width, y - 10);
        }

        // Bar background
        ctx.fillStyle = "#333";
        ctx.fillRect(x, y, w, h);

        // Fill - purple gradient
        if (fillW > 0) {
            const grad = ctx.createLinearGradient(x, y, x + fillW, y);
            grad.addColorStop(0, "#7b2ff7");
            grad.addColorStop(1, "#c77dff");
            ctx.fillStyle = grad;
            ctx.fillRect(x, y, fillW, h);
        }

        // Pulse glow when full and not active
        if (!active && ratio >= 1) {
            const pulse = 0.3 + 0.3 * Math.sin(Date.now() / 200);
            ctx.fillStyle = `rgba(199, 125, 255, ${pulse})`;
            ctx.fillRect(x, y, w, h);
        }

        // Border
        ctx.strokeStyle = active ? "#c77dff" : "#666";
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.restore();
    }
}

export default GameScene;
