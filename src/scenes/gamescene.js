import Scene from "./scene.js";
import Player from "../actors/player.js";
import Enemy from "../actors/enemy.js";
import DeathScene from "./deathscene.js";

class GameScene extends Scene {
    constructor(game) {
        super(game);
        this.isGameplay = true;

        this.player = null;
    }

    enter() {
        // reset entities for a clean run
        this.game.entities = [];

        // spawn player + enemies
        this.player = new Player(this.game, 100, 500);
        this.game.addEntity(this.player);

        const enemy1 = new Enemy(this.game, 300, 500);
        const enemy2 = new Enemy(this.game, 500, 400);
        const enemy3 = new Enemy(this.game, 700, 600);

        this.game.addEntity(enemy1);
        this.game.addEntity(enemy2);
        this.game.addEntity(enemy3);
    }

    update() {
        // If player is removed (dies), go to death scene
        if (this.player && this.player.removeFromWorld) {
            this.game.sceneManager.changeScene(new DeathScene(this.game));
        }
    }

    draw(ctx) {
        // TODO
    }
}

export default GameScene;