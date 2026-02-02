
class SceneManager {
  constructor(game) {
    this.game = game;
    this.currentScene = null;
  }

  changeScene(scene) {
    if (this.currentScene) this.currentScene.exit();
    this.currentScene = scene;
    if (this.currentScene) this.currentScene.enter();
  }

  update() {
    if (this.currentScene) this.currentScene.update();
  }

  draw(ctx) {
    if (this.currentScene) this.currentScene.draw(ctx);
  }

  onKeyDown(e) {
    if (this.currentScene && this.currentScene.onKeyDown) {
      this.currentScene.onKeyDown(e);
    }
  }

  onKeyUp(e) {
    if (this.currentScene && this.currentScene.onKeyUp) {
      this.currentScene.onKeyUp(e);
    }
  }

  onClick(x, y) {
    if (this.currentScene && this.currentScene.onClick) {
      this.currentScene.onClick(x, y);
    }
  }
}

export default SceneManager;