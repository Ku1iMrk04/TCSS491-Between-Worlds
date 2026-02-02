import { GameEngine } from "./gameengine.js";
import { AssetManager } from "./assetmanager.js";
import { setupCollisions } from "./src/collision/collisionsetup.js";
import SceneManager from "./src/scenes/scenemanager.js";
import MenuScene from "./src/scenes/menuscene.js";
//import Player from "./src/actors/player.js";
//import Enemy from "./src/actors/enemy.js";

const gameEngine = new GameEngine({ debugging: true });

const ASSET_MANAGER = new AssetManager();
// Sprite sheets with animations (will load .json metadata)
ASSET_MANAGER.queueSprite("assets/zero.png");
ASSET_MANAGER.queueSprite("assets/enemy_scientist.png");

// Background images (no metadata needed)
ASSET_MANAGER.queueDownload("assets/menu_background.png");
ASSET_MANAGER.queueDownload("assets/level_background.png");


ASSET_MANAGER.downloadAll(() => {
	const canvas = document.getElementById("gameWorld");
	const ctx = canvas.getContext("2d");

	gameEngine.init(ctx);
	gameEngine.assetManager = ASSET_MANAGER;

	setupCollisions(gameEngine.collisionManager);

	gameEngine.sceneManager = new SceneManager(gameEngine);
    const menuBg = ASSET_MANAGER.getAsset("assets/menu_background.png");

	gameEngine.menuBgImage = menuBg;
    const levelBg = ASSET_MANAGER.getAsset("assets/level_background.png");


    gameEngine.sceneManager.changeScene(new MenuScene(gameEngine, menuBg, levelBg));

	//const player = new Player(gameEngine, 100, 500);
	//gameEngine.addEntity(player);

	//const enemy1 = new Enemy(gameEngine, 300, 500);
	//const enemy2 = new Enemy(gameEngine, 500, 400);
	//const enemy3 = new Enemy(gameEngine, 700, 600);
	//gameEngine.addEntity(enemy1);
	//gameEngine.addEntity(enemy2);
	//gameEngine.addEntity(enemy3);

	gameEngine.start();
});
