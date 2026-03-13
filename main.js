import { GameEngine } from "./gameengine.js";
import { AssetManager } from "./assetmanager.js";
import { setupCollisions } from "./src/collision/collisionsetup.js";
import SceneManager from "./src/scenes/scenemanager.js";
import MenuScene from "./src/scenes/menuscene.js";
import MapLoader from "./src/map/maploader.js";
import MusicManager from "./src/audio/musicmanager.js";

const gameEngine = new GameEngine({ debugging: false });
const mapLoader = new MapLoader();

const ASSET_MANAGER = new AssetManager();
// Sprite sheets with animations (will load .json metadata)
ASSET_MANAGER.queueSprite("assets/ninja.png");
ASSET_MANAGER.queueSprite("assets/zero.png");
ASSET_MANAGER.queueSprite("assets/enemy_scientist.png");
ASSET_MANAGER.queueSprite("assets/grunt_idle.png");
ASSET_MANAGER.queueSprite("assets/gangsteridle_3.png");

// Background images (no metadata needed)
ASSET_MANAGER.queueDownload("assets/menu_background.png");
ASSET_MANAGER.queueDownload("assets/level_background.png");

// Debug images
ASSET_MANAGER.queueDownload("assets/Frame3Attack.png");

// Fallback image for missing animations
ASSET_MANAGER.queueDownload("assets/NoSpriteBudda.png");
// Tileset images for the prison map
ASSET_MANAGER.queueDownload("assets/prison_background.png");
ASSET_MANAGER.queueDownload("assets/prison_foreground.png");


ASSET_MANAGER.downloadAll(async () => {
	const canvas = document.getElementById("gameWorld");
	const ctx = canvas.getContext("2d");

	gameEngine.init(ctx);
	gameEngine.assetManager = ASSET_MANAGER;

	// Get tileset images
	const tilesets = {
		background: ASSET_MANAGER.getAsset("assets/prison_background.png"),
		foreground: ASSET_MANAGER.getAsset("assets/prison_foreground.png")
	};

	// Load all level tilemaps
	const levelMaps = await Promise.all([
		mapLoader.load("assets/maps/1-1.json", tilesets),
		mapLoader.load("assets/maps/1-2.json", tilesets),
		mapLoader.load("assets/maps/1-3.json", tilesets),
		mapLoader.load("assets/maps/1-4.json", tilesets),
	]);
	gameEngine.levelMaps = levelMaps;
	gameEngine.tileMap = levelMaps[0];

	setupCollisions(gameEngine.collisionManager);

	// Music setup — register tracks here, add more as needed
	const musicManager = new MusicManager();
	musicManager.register("gameplay", "assets/sounds/backgroundMusic.mp3");
	musicManager.register("dream", "assets/sounds/dreamBackgroundMusic.mp3");
	// musicManager.register("menu",     "assets/audio/menu.mp3");
	// musicManager.register("boss",     "assets/audio/boss.mp3");
	gameEngine.musicManager = musicManager;

	gameEngine.sceneManager = new SceneManager(gameEngine);
    const menuBg = ASSET_MANAGER.getAsset("assets/menu_background.png");

	gameEngine.menuBgImage = menuBg;
    const levelBg = ASSET_MANAGER.getAsset("assets/level_background.png");


    gameEngine.sceneManager.changeScene(new MenuScene(gameEngine, menuBg, levelBg));

	gameEngine.start();
});
