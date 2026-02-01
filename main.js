import { GameEngine } from "./gameengine.js";
import { AssetManager } from "./assetmanager.js";
import { setupCollisions } from "./src/collision/collisionsetup.js";
import Player from "./src/actors/player.js";
import Enemy from "./src/actors/enemy.js";
const gameEngine = new GameEngine({ debugging: true });

const ASSET_MANAGER = new AssetManager();
ASSET_MANAGER.queueSprite("assets/zero.png");

ASSET_MANAGER.downloadAll(() => {
	const canvas = document.getElementById("gameWorld");
	const ctx = canvas.getContext("2d");

	gameEngine.init(ctx);
	gameEngine.assetManager = ASSET_MANAGER;
	setupCollisions(gameEngine.collisionManager);

	const player = new Player(gameEngine, 100, 500);
	gameEngine.addEntity(player);

	const enemy1 = new Enemy(gameEngine, 300, 500);
	const enemy2 = new Enemy(gameEngine, 500, 400);
	const enemy3 = new Enemy(gameEngine, 700, 600);
	gameEngine.addEntity(enemy1);
	gameEngine.addEntity(enemy2);
	gameEngine.addEntity(enemy3);

	gameEngine.start();
});
