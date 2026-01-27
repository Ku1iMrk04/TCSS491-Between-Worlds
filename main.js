import { GameEngine } from "./gameengine.js";
import { AssetManager } from "./assetmanager.js";
import Player from "./src/actors/player.js";
const gameEngine = new GameEngine();

const ASSET_MANAGER = new AssetManager();

ASSET_MANAGER.downloadAll(() => {
	const canvas = document.getElementById("gameWorld");
	const ctx = canvas.getContext("2d");

	gameEngine.init(ctx);

	const player = new Player(gameEngine, 100, 500);
	gameEngine.addEntity(player);

	gameEngine.start();
});
