import { GameEngine } from "./gameengine.js";
import { AssetManager } from "./assetmanager.js";
import { setupCollisions } from "./src/collision/collisionsetup.js";
import SceneManager from "./src/scenes/scenemanager.js";
import MenuScene from "./src/scenes/menuscene.js";
import MapLoader from "./src/map/maploader.js";

const gameEngine = new GameEngine({ debugging: true });
const mapLoader = new MapLoader();

const ASSET_MANAGER = new AssetManager();
// Sprite sheets with animations (will load .json metadata)
ASSET_MANAGER.queueSprite("assets/zero.png");
ASSET_MANAGER.queueSprite("assets/enemy_scientist.png");

// Background images (no metadata needed)
ASSET_MANAGER.queueDownload("assets/menu_background.png");
ASSET_MANAGER.queueDownload("assets/level_background.png");

// Fallback image for missing animations
ASSET_MANAGER.queueDownload("assets/NoSpriteBudda.png");


ASSET_MANAGER.downloadAll(async () => {
	const canvas = document.getElementById("gameWorld");
	const ctx = canvas.getContext("2d");

	gameEngine.init(ctx);
	gameEngine.assetManager = ASSET_MANAGER;

	// Load the tilemap
	const tileMap = await mapLoader.load("assets/maps/level1.json");
	gameEngine.tileMap = tileMap;

	setupCollisions(gameEngine.collisionManager);

	gameEngine.sceneManager = new SceneManager(gameEngine);
    const menuBg = ASSET_MANAGER.getAsset("assets/menu_background.png");

	gameEngine.menuBgImage = menuBg;
    const levelBg = ASSET_MANAGER.getAsset("assets/level_background.png");


    gameEngine.sceneManager.changeScene(new MenuScene(gameEngine, menuBg, levelBg));

	gameEngine.start();
});
