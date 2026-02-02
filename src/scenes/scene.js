
class Scene {
  constructor(game) {
    this.game = game;
    this.isGameplay = false; // GameScene will set true
  }

  enter() {}
  exit() {}

  update() {}
  draw(ctx) {}

  onKeyDown(e) {}
  onKeyUp(e) {}
  onClick(x, y) {}
}

export default Scene;