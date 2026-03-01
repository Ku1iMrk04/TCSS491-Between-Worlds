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

class GameScene extends Scene {
    constructor(game, levelBgImage, levelName = "Level 1") {
        super(game);
        this.isGameplay = true;
        this.levelBgImage = levelBgImage;

        this.player = null;
        this.levelCompleteTriggered = false;
        this.isPaused = false;
        this.showPauseControls = false;

        this.ui = new GameUI(game, levelName);
    }

    enter() {
        this.game.entities = [];
        this.levelCompleteTriggered = false;
        this.isPaused = false;
        this.showPauseControls = false;
        this.ui.startLevel();

        const tileMap = this.game.tileMap;

        const viewportWidth = 960;
        const viewportHeight = 540;
        const worldWidth = tileMap.width * tileMap.tileWidth;
        const worldHeight = tileMap.height * tileMap.tileHeight;

        this.game.camera = new Camera(viewportWidth, viewportHeight, worldWidth, worldHeight);

        const playerSpawn = tileMap.getPlayerSpawn();
        if (playerSpawn) {
            this.player = new Player(this.game, playerSpawn.x, playerSpawn.y);
        } else {
            this.player = new Player(this.game, 300, 750);
        }
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

    onKeyDown(event) {
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
            this.game.sceneManager.changeScene(new GameScene(this.game, this.levelBgImage));
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
