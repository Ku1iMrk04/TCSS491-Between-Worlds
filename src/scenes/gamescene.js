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
import GameUI from "../ui/GameUI.js";

const ENEMY_COLLISION_LAYER = "enemy";
const PAUSE_OPTION_RESUME = "Resume";
const PAUSE_OPTION_RESTART = "Restart";
const PAUSE_OPTION_CONTROLS = "Controls";

// Per-level player spawn positions (x, y in world pixels).
// Adjust these if a level's starting position feels wrong.
const LEVEL_SPAWN_POINTS = [
    { x: 160, y: 498 },   // Level 1 - floor at row 18 (y=576), player height 78px
    { x: 160, y: 498 },   // Level 2 - same floor layout
    { x: 400, y: 820 },   // Level 3
    { x: 160, y: 498 },   // Level 4
];

class GameScene extends Scene {
    constructor(game, levelBgImage, levelIndex = 0) {
        super(game);
        this.isGameplay = true;
        this.levelBgImage = levelBgImage;
        this.levelIndex = levelIndex;

        this.player = null;
        this.levelCompleteTriggered = false;
        this.isPaused = false;
        this.showPauseControls = false;

        this.ui = new GameUI(game, `Level ${levelIndex + 1}`);
    }

    enter() {
        this.game.entities = [];
        this.levelCompleteTriggered = false;
        this.isPaused = false;
        this.showPauseControls = false;
        this.ui.startLevel();

        if (this.game.musicManager) {
            this.game.musicManager.play("gameplay");
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

    exit() {
        if (this.game.musicManager) {
            this.game.musicManager.stop();
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
            this.game.sceneManager.changeScene(new DeathScene(this.game, this.levelBgImage));
            return;
        }

        if (this.getAliveEnemyCount() === 0) {
            this.levelCompleteTriggered = true;
            const totalLevels = this.game.levelMaps ? this.game.levelMaps.length : 1;
            const hasNextLevel = this.levelIndex + 1 < totalLevels;
            this.game.sceneManager.changeScene(new LevelCompleteScene(
                this.game,
                this.levelBgImage,
                this.levelIndex,
                () => new GameScene(this.game, this.levelBgImage, this.levelIndex),
                hasNextLevel ? () => new GameScene(this.game, this.levelBgImage, this.levelIndex + 1) : null,
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

        // Dream state background tint (world space)
        if (this.player && this.player.inDreamState) {
            ctx.save();
            ctx.fillStyle = "rgba(100, 0, 150, 0.15)";
            const cam = this.game.camera;
            ctx.fillRect(cam.x, cam.y, cam.viewportWidth, cam.viewportHeight);
            ctx.restore();
        }

        if (this.game.tileMap) {
            this.game.tileMap.drawBackground(ctx);
            this.game.tileMap.drawForeground(ctx);

            // DEBUG: Draw collision hitboxes
            this.game.tileMap.drawDebug(ctx);
        }

        ctx.restore();

        // Screen-space UI
        this.ui.draw(ctx, this.player);
    }

    drawOverlay(ctx) {
        this.ui.drawOverlay(ctx, this.isPaused, this.showPauseControls);
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
