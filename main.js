import { GameEngine } from "./gameengine.js";
import { AssetManager } from "./assetmanager.js";
import { setupCollisions } from "./src/collision/collisionsetup.js";
import SceneManager from "./src/scenes/scenemanager.js";
import MenuScene from "./src/scenes/menuscene.js";
import MapLoader from "./src/map/maploader.js";
import SoundManager from "./src/audio/musicmanager.js";

const gameEngine = new GameEngine({ debugging: false });
const mapLoader = new MapLoader();

const ASSET_MANAGER = new AssetManager();
// Sprite sheets with animations (will load .json metadata)
ASSET_MANAGER.queueSprite("assets/ninja.png");
ASSET_MANAGER.queueSprite("assets/kid.png");  // Dream state sprite
ASSET_MANAGER.queueSprite("assets/zero.png");
ASSET_MANAGER.queueSprite("assets/enemy_scientist.png");
ASSET_MANAGER.queueSprite("assets/scientist_sprite_sheet.png");
ASSET_MANAGER.queueSprite("assets/grunt_sprite_sheet.png");
ASSET_MANAGER.queueSprite("assets/gangsteridle_3.png");
ASSET_MANAGER.queueSprite("assets/turret_sprite_sheet.png");

// Door sprite
ASSET_MANAGER.queueDownload("assets/door.png");

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

	// --- Centralized sound setup ---
	// Register ALL game sounds here. This is the single place to add/change audio.
	const soundManager = new SoundManager();

	// Music tracks
	soundManager.registerMusic("gameplay", "assets/sounds/backgroundMusic.mp3");
	soundManager.registerMusic("dream",    "assets/sounds/dreamBackgroundMusic.mp3");
	soundManager.registerMusic("menu",     "assets/sounds/menuMusic.mp3");

	// Player SFX
	soundManager.registerSfx("jump",          "assets/sounds/jump.wav",           0.4);
	soundManager.registerSfx("softLanding",    "assets/sounds/softLanding.mp3",    0.4);
	soundManager.registerSfx("hardLanding",    "assets/sounds/hardLanding.mp3",    0.4);
	soundManager.registerSfx("swordMiss",      "assets/sounds/swordMiss.wav",      0.4);
	soundManager.registerSfx("swordHit",       "assets/sounds/swordHit.wav",       0.1);
	soundManager.registerSfx("dodge",          "assets/sounds/dodge.mp3",          0.4);
	soundManager.registerSfx("dreamActivate",  "assets/sounds/dreamActivate.mp3",  0.4);
	soundManager.registerSfx("dreamDashMiss",  "assets/sounds/dreamDashMiss.mp3",  0.4);
	soundManager.registerSfx("dreamDashHit",   "assets/sounds/dreamDashHit.mp3",   0.4);

	// Enemy SFX
	soundManager.registerSfx("gruntTriggered", "assets/sounds/gruntTriggered.mp3", 0.1);
	soundManager.registerSfx("laserGun",       "assets/sounds/laserGun.mp3",       0.2);

	gameEngine.soundManager = soundManager;

	gameEngine.sceneManager = new SceneManager(gameEngine);
    const menuBg = ASSET_MANAGER.getAsset("assets/menu_background.png");

	gameEngine.menuBgImage = menuBg;
    const levelBg = ASSET_MANAGER.getAsset("assets/level_background.png");


    gameEngine.sceneManager.changeScene(new MenuScene(gameEngine, menuBg, levelBg));

	gameEngine.start();
});
