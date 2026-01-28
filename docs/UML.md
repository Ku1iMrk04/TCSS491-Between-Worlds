# Between Worlds - Class UML Diagram

## GameEngine (Core System)


---

## Collision System Integration

### Collision Response Types

| Scenario | Response |
|----------|----------|
| Player ↔ Environment | Block movement (resolve overlap) |
| Player ↔ Enemy | Trigger damage, knockback |
| Attack hitbox ↔ Enemy | Deal damage, no physics |
| Projectile ↔ Any | Trigger effect, destroy projectile |

### GameEngine.update() Flow

```
GameEngine.update()
│
├─1─► Update all entities (movement)
│     for each entity: entity.update()
│
├─2─► CollisionManager.checkAllCollisions()
│
├─3─► For each collision pair:
│     ├── entityA.onCollision(entityB, overlap)
│     └── entityB.onCollision(entityA, overlap)
│
└─4─► Remove dead entities
```

### Collision Layer Matrix

| Layer | Collides With |
|-------|---------------|
| player | environment, enemy, projectile |
| enemy | environment, player, projectile |
| projectile | player, enemy, environment |
| environment | player, enemy, projectile |

---

## Implementation Order

1. Create **Collider** class with AABB (axis-aligned bounding box) collision
2. Add **collider** property to Actor class
3. Create **CollisionManager** class
4. Integrate manager into **GameEngine.update()**
5. Add **onCollision()** callbacks to Player/Enemy
6. Add debug drawing (optional - show hitboxes)

---

## File Structure

```
TCSS491-Between-Worlds/
├── index.html
├── main.js
├── gameengine.js          ◄── Add CollisionManager integration
├── assetmanager.js
├── timer.js
├── util.js
├── assets/
│   └── katanaZeroSpriteSHeet.png
├── docs/
│   └── UML.md             ◄── This file
└── src/
    ├── actors/
    │   ├── actor.js       ◄── Add collider property + onCollision()
    │   ├── player.js
    │   └── enemy.js
    ├── animation/
    │   ├── animator.js
    │   └── spriteatlas.js
    ├── collision/         ◄── NEW FOLDER
    │   ├── collider.js
    │   └── collisionmanager.js
    └── states/
        ├── state.js
        ├── idle.js
        ├── run.js
        ├── jump.js
        ├── attack.js
        ├── crouch.js
        └── roll.js
```
