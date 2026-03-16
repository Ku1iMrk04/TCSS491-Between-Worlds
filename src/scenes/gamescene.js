import Scene from "./scene.js";
import Player from "../actors/player.js";
import Enemy from "../actors/enemy.js";
import GruntEnemy from "../actors/gruntenemy.js";
import ScientistEnemy from "../actors/scientistenemy.js";
import GangsterEnemy from "../actors/gangsterenemy.js";
import Turret from "../actors/turret.js";
import Door from "../actors/door.js";
import DeathScene from "./deathscene.js";
import LevelCompleteScene from "./levelcompletescene.js";
import MenuScene from "./menuscene.js";
import Camera from "../camera.js";
import GameUI from "../ui/GameUI.js";

const ENEMY_COLLISION_LAYER = "enemy";
const PAUSE_OPTION_RESUME = "Resume";
const PAUSE_OPTION_RESTART = "Restart";
const PAUSE_OPTION_CONTROLS = "Controls";

// Per-level player spawn positions (x, y in world pixels).
// Adjust these if a level's starting position feels wrong.
const LEVEL_SPAWN_POINTS = [
    { x: 160, y: 498 },   // Level 1
    { x: 160, y: 498 },   // Level 2
    { x: 34,  y: 1430 },  // Level 3
    { x: 160, y: 402 },   // Level 4
];

// Enemy spawn points per level. Each entry is an array of { x, y, type } objects.
// type can be "grunt", "scientist", "gangster", or "turret".
const LEVEL_ENEMY_SPAWNS = [
    // Level 1 (world: 2240 x 1152)
    [
        { x: 800,  y: 336, type: "grunt", facing: "right" },       // upper platform, left
        { x: 1344, y: 336, type: "grunt", facing: "left" },       // upper platform, center-right
        { x: 1152, y: 656, type: "grunt", facing: "right" },       // lower level, center
        { x: 1664, y: 656, type: "scientist" },   // lower level, right
    ],
    // Level 2 (world: 2304 x 768)
    [
        { x: 512,  y: 432, type: "grunt", facing: "left" },       // left platform
        { x: 928, y: 560, type: "grunt", facing: "left" },      // lower center
        { x: 1152, y: 560, type: "scientist", facing: "left" },     
        { x: 1120, y: 368, type: "turret" },   // upper center
        { x: 1760, y: 432, type: "grunt" },       // right platform
        { x: 2176, y: 560, type: "turret", facing: "left" },      // map end, lower right
    ],
    // Level 3 (world: 2304 x 1600)
    [
        { x: 64,   y: 800,  type: "grunt", facing: "right" },
        { x: 576,  y: 800,  type: "grunt" },      // upper platform, left
        { x: 832,  y: 784,  type: "turret" },  // upper platform, center-left
        { x: 960,  y: 784,  type: "scientist", facing: "right" },  // upper platform, center
        { x: 1280, y: 800,  type: "grunt" },      // upper platform, right
        { x: 1824, y: 928,  type: "grunt" },      // right elevated section
        { x: 416,  y: 1072, type: "scientist" },  // left mid-tier
        
        { x: 928,  y: 1232, type: "grunt" },      // lower level, center-left
        { x: 1280, y: 1232, type: "grunt" },      // lower level, center
        { x: 1440, y: 1232, type: "scientist" },  // lower level, center-right
        { x: 2176, y: 800,  type: "turret", facing: "left" },     // upper far right corner
        { x: 448,  y: 1360, type: "grunt" },      // bottom floor
    ],
    // Level 4 (world: 2048 x 1024)
    [
        
        { x: 1056, y: 432, type: "scientist" },   
        { x: 1024, y: 432, type: "grunt" },       // upper platform, center
        
        { x: 1856, y: 496, type: "grunt" },       // upper far right
        { x: 1632, y: 496, type: "turret" },       // upper far right
        { x: 128,  y: 624, type: "scientist", facing: "right" },   // mid left
        { x: 544,  y: 624, type: "grunt" },       // mid center-left
        
        { x: 32,  y: 816, type: "turret", facing: "right" },   // floor far left
        { x: 416,  y: 816, type: "grunt" },       // floor left
        { x: 720,  y: 816, type: "scientist" },   // floor center-left
        { x: 864,  y: 816, type: "grunt" },       // floor center
        { x: 1472, y: 816, type: "grunt" },       // floor right
       
]];

// Door spawn positions per level. Each entry is an array of { x, y, w?, h? } objects.
const LEVEL_DOOR_SPAWNS = [
    // Level 1 — lower floor
    [
        { x: 1440, y: 672 },
    ],
    [], // Level 2
    // Level 3 — upper platform + bottom floor
    [
        { x: 480,  y: 832  },  // upper platform, far left
        { x: 928,  y: 832  },  // upper platform, center-left
        { x: 1440, y: 832  },  // upper platform, center-right
        { x: 352,  y: 1408 },  // bottom floor, far left
        { x: 1216, y: 1280 },  // bottom floor, center-left
        { x: 1568, y: 1280 },  // bottom floor, center-right
    ],
    // Level 4 — second floor + bottom floor
    [
        { x: 800,  y: 608 },   // second floor, center
        { x: 512,  y: 800 },   // bottom floor, left
        { x: 864,  y: 800 },   // bottom floor, center-left
        { x: 1184, y: 800 },   // bottom floor, center-right
    ],
];

// Exit portal positions per level (x, y in world pixels, center of portal).
// After all enemies are defeated the player must reach this point to finish the level.
const LEVEL_EXIT_POINTS = [
    { x: 2210, y: 584 },  // Level 1
    { x: 2270, y: 580 },  // Level 2
    { x: 2270, y: 1200 }, // Level 3
    null,                  // Level 4 – kills all enemies to complete (no exit point yet)
];

const EXIT_PORTAL_RADIUS = 80;   // pixels from portal center that triggers level complete

class GameScene extends Scene {
    constructor(game, levelBgImage, levelIndex = 0) {
        super(game);
        this.isGameplay = true;
        this.levelBgImage = levelBgImage;
        this.levelIndex = levelIndex;

        this.player = null;
        this.levelCompleteTriggered = false;
        this.allEnemiesDefeated = false;
        this.exitAnimTime = 0;
        this.isPaused = false;
        this.showPauseControls = false;

        this.ui = new GameUI(game, `Level ${levelIndex + 1}`);
    }

    enter() {
        this.game.entities = [];
        this.levelCompleteTriggered = false;
        this.allEnemiesDefeated = false;
        this.exitAnimTime = 0;
        this.isPaused = false;
        this.showPauseControls = false;
        this.ui.startLevel();

        if (this.game.soundManager) {
            this.game.soundManager.playMusic("gameplay");
        }

        // Load the map for this level
        if (this.game.levelMaps && this.game.levelMaps[this.levelIndex]) {
            this.game.tileMap = this.game.levelMaps[this.levelIndex];
        }

        const tileMap = this.game.tileMap;

        const viewportWidth = 960;
        const viewportHeight = 540;
        const worldWidth = tileMap.width * tileMap.tileWidth;
        const worldHeight = tileMap.height * tileMap.tileHeight;

        this.game.camera = new Camera(viewportWidth, viewportHeight, worldWidth, worldHeight);

        const levelSpawn = LEVEL_SPAWN_POINTS[this.levelIndex];
        const playerSpawn = levelSpawn || tileMap.getPlayerSpawn() || { x: 300, y: 750 };
        this.player = new Player(this.game, playerSpawn.x, playerSpawn.y);
        this.game.addEntity(this.player);
        this.game.camera.follow(this.player);

        const enemySpawns = LEVEL_ENEMY_SPAWNS[this.levelIndex] || [];
        for (const spawn of enemySpawns) {
            let enemy;
            if (spawn.type === "grunt") {
                enemy = new GruntEnemy(this.game, spawn.x, spawn.y);
            } else if (spawn.type === "gangster") {
                enemy = new GangsterEnemy(this.game, spawn.x, spawn.y);
            } else if (spawn.type === "scientist") {
                enemy = new ScientistEnemy(this.game, spawn.x, spawn.y);
            } else if (spawn.type === "turret") {
                enemy = new Turret(this.game, spawn.x, spawn.y);
            } else {
                enemy = new Enemy(this.game, spawn.x, spawn.y);
            }
            if (spawn.facing) {
                enemy.facing = spawn.facing;
                enemy.animator.setDirection(spawn.facing);
            }
            this.game.addEntity(enemy);
        }

        const doorSpawns = LEVEL_DOOR_SPAWNS[this.levelIndex] || [];
        for (const spawn of doorSpawns) {
            this.game.addEntity(new Door(this.game, spawn.x, spawn.y, spawn.w, spawn.h));
        }
    }

    exit() {
        if (this.game.soundManager) {
            this.game.soundManager.stopMusic();
        }
    }

    onKeyDown(event) {
        if (event.code === "Escape") {
            if (this.isPaused) {
                this.resumeGameplay();
            } else {
                this.pauseGameplay();
            }
            return;
        }
        if (event.code === "KeyR") {
            this.game.sceneManager.changeScene(new MenuScene(this.game, this.game.menuBgImage, this.levelBgImage));
        }
    }

    onClick(x, y) {
        const pauseButtonRect = this.ui.getPauseButtonRect();
        const muteButtonRect  = this.ui.getMuteButtonRect();

        // Mute button works whether paused or not
        if (muteButtonRect && this.isPointInsideRect(x, y, muteButtonRect)) {
            if (this.game.soundManager) this.game.soundManager.toggleMute();
            this.game.click = null;
            return;
        }

        if (this.isPaused) {
            this.game.click = null;

            if (pauseButtonRect && this.isPointInsideRect(x, y, pauseButtonRect)) return;

            for (const button of this.ui.pauseMenuButtonRects) {
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
        if (this.isPaused) return;

        this.ui.update(this.game.clockTick);

        if (this.levelCompleteTriggered) return;

        if (this.player && this.player.removeFromWorld) {
            const frozenFrame = this.captureDeathFrame();
            this.game.sceneManager.changeScene(
                new DeathScene(this.game, this.levelBgImage, this.levelIndex, frozenFrame)
            );
            return;
        }

        const exitPoint = LEVEL_EXIT_POINTS[this.levelIndex] ?? null;

        if (!this.allEnemiesDefeated && this.getAliveEnemyCount() === 0) {
            this.allEnemiesDefeated = true;
            // If this level has no exit point, complete immediately (old behaviour)
            if (!exitPoint) {
                this._triggerLevelComplete();
            }
        }

        if (this.allEnemiesDefeated && exitPoint && this.player) {
            this.exitAnimTime += this.game.clockTick || 0;
            const px = this.player.x + (this.player.width  ?? 64) / 2;
            const py = this.player.y + (this.player.height ?? 78) / 2;
            const dx = px - exitPoint.x;
            const dy = py - exitPoint.y;
            if (Math.sqrt(dx * dx + dy * dy) <= EXIT_PORTAL_RADIUS) {
                this._triggerLevelComplete();
            }
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

    _triggerLevelComplete() {
        if (this.levelCompleteTriggered) return;
        this.levelCompleteTriggered = true;
        const totalLevels = this.game.levelMaps ? this.game.levelMaps.length : 1;
        const hasNextLevel = this.levelIndex + 1 < totalLevels;
        if (hasNextLevel) {
            // Directly load the next level
            this.game.sceneManager.changeScene(new GameScene(this.game, this.levelBgImage, this.levelIndex + 1));
        } else {
            // Last level — show completion screen
            this.game.sceneManager.changeScene(new LevelCompleteScene(
                this.game,
                this.levelBgImage,
                this.levelIndex,
                () => new GameScene(this.game, this.levelBgImage, this.levelIndex),
                null,
                () => new MenuScene(this.game, this.game.menuBgImage, this.levelBgImage)
            ));
        }
    }

    draw(ctx) {
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;

        const scale = 2;
        ctx.save();
        ctx.scale(scale, scale);

        if (this.game.camera) {
            this.game.camera.applyTransform(ctx);
        }

        if (this.game.tileMap) {
            // Dream state: show collision shapes in white on black background
            if (this.player && this.player.inDreamState) {
                this.game.tileMap.drawCollisionView(ctx);
            } else {
                // Normal rendering
                this.game.tileMap.drawBackground(ctx);
                this.game.tileMap.drawForeground(ctx);

                // DEBUG: Draw collision hitboxes (only when debugging is enabled)
                if (this.game.options?.debugging) {
                    this.game.tileMap.drawDebug(ctx);
                }
            }
        }

        ctx.restore();

        // Screen-space UI
        this.ui.draw(ctx, this.player);

        // Screen-space exit arrow (drawn on top of UI so it's always visible)
        if (this.allEnemiesDefeated) {
            this._drawExitArrow(ctx);
        }
    }

    _drawExitArrow(ctx) {
        const exitPoint = LEVEL_EXIT_POINTS[this.levelIndex];
        if (!exitPoint) return;
        const cam = this.game.camera;
        if (!cam) return;

        const scale = 2;
        const cw = ctx.canvas.width;
        const ch = ctx.canvas.height;

        // Convert exit world position → screen position
        const sx = (exitPoint.x - cam.x) * scale;
        const sy = (exitPoint.y - cam.y) * scale;

        const pulse = Math.sin(this.exitAnimTime * 3) * 0.5 + 0.5;
        const margin = 80;
        const onScreen = sx >= margin && sx <= cw - margin &&
                         sy >= margin && sy <= ch - margin;

        ctx.save();
        if (onScreen) {
            // Bounce above the exit point
            const bounce = Math.sin(this.exitAnimTime * 5) * 8;
            const arrowY = sy - 80 + bounce;
            this._drawArrowShape(ctx, sx, arrowY, Math.PI / 2, pulse);
            ctx.font = 'bold 22px "Oxanium", sans-serif';
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillStyle = `rgba(255, 215, 60, ${0.85 + pulse * 0.15})`;
            ctx.shadowColor = "#fbbf24";
            ctx.shadowBlur = 14;
            ctx.fillText("GO", sx, arrowY - 36);
        } else {
            // Clamp direction to screen edge
            const cx = cw / 2, cy = ch / 2;
            const dx = sx - cx, dy = sy - cy;
            const angle = Math.atan2(dy, dx);
            const ew = cw / 2 - margin;
            const eh = ch / 2 - margin;
            const ratio = Math.max(Math.abs(dx) / ew, Math.abs(dy) / eh);
            const px = cx + dx / ratio;
            const py = cy + dy / ratio;
            this._drawArrowShape(ctx, px, py, angle, pulse);
            // "GO" label offset inward from the arrow
            const tx = px - Math.cos(angle) * 58;
            const ty = py - Math.sin(angle) * 58;
            ctx.font = 'bold 20px "Oxanium", sans-serif';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = `rgba(255, 215, 60, ${0.85 + pulse * 0.15})`;
            ctx.shadowColor = "#fbbf24";
            ctx.shadowBlur = 14;
            ctx.fillText("GO", tx, ty);
        }
        ctx.restore();
    }

    _drawArrowShape(ctx, x, y, angle, pulse) {
        const s = 26 + pulse * 4;
        const alpha = 0.85 + pulse * 0.15;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        ctx.fillStyle = `rgba(255, 200, 50, ${alpha})`;
        ctx.strokeStyle = `rgba(255, 240, 130, ${alpha * 0.7})`;
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 14 + pulse * 10;
        ctx.lineWidth = 1.5;

        // Arrow pointing right (rotated to face the target)
        ctx.beginPath();
        ctx.moveTo(s,         0);           // tip
        ctx.lineTo(s * 0.1,  -s * 0.65);   // top wing
        ctx.lineTo(s * 0.1,  -s * 0.28);   // top inner
        ctx.lineTo(-s * 0.75, -s * 0.28);  // back top
        ctx.lineTo(-s * 0.75,  s * 0.28);  // back bottom
        ctx.lineTo(s * 0.1,   s * 0.28);   // bottom inner
        ctx.lineTo(s * 0.1,   s * 0.65);   // bottom wing
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    }

    drawOverlay(ctx) {
        this.ui.drawOverlay(ctx, this.isPaused, this.showPauseControls);
    }

    captureDeathFrame() {
        const sourceCanvas = this.game?.ctx?.canvas;
        if (!sourceCanvas || typeof document === "undefined") {
            return null;
        }

        const frozenFrame = document.createElement("canvas");
        frozenFrame.width = sourceCanvas.width;
        frozenFrame.height = sourceCanvas.height;
        const frozenCtx = frozenFrame.getContext("2d");
        if (!frozenCtx) {
            return null;
        }

        frozenCtx.imageSmoothingEnabled = false;
        frozenCtx.drawImage(sourceCanvas, 0, 0);
        return frozenFrame;
    }

    isPointInsideRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
    }

    handlePauseOption(action) {
        if (action === PAUSE_OPTION_RESUME) {
            this.resumeGameplay();
        } else if (action === PAUSE_OPTION_RESTART) {
            this.game.sceneManager.changeScene(new GameScene(this.game, this.levelBgImage, this.levelIndex));
        } else if (action === PAUSE_OPTION_CONTROLS) {
            this.showPauseControls = !this.showPauseControls;
        }
    }

    pauseGameplay() {
        if (this.isPaused) return;
        this.isPaused = true;
        this.showPauseControls = false;
        this.game.click = null;
    }

    resumeGameplay() {
        if (!this.isPaused) return;
        this.isPaused = false;
        this.showPauseControls = false;
        this.game.click = null;
    }
}

export default GameScene;
