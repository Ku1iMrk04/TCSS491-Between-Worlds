import { GameEngine } from "./gameengine.js";
import { AssetManager } from "./assetmanager.js";
import Player from "./src/actors/player.js";
import Enemy from "./src/actors/enemy.js";
const gameEngine = new GameEngine();

const ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.downloadAll(() => {
	const canvas = document.getElementById("gameWorld");
	const ctx = canvas.getContext("2d");

	gameEngine.init(ctx);


	const player = new Player(gameEngine, 100, 500);
	gameEngine.addEntity(player);

	const enemy = new Enemy(gameEngine, 300, 500);
	gameEngine.addEntity(enemy);

	gameEngine.start();
});
