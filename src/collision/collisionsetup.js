/**
 * Game-specific collision configuration.
 * Sets up layer rules and collision handlers for this game.
 */

/**
 * Initialize collision rules and handlers for the game
 * @param {CollisionManager} collisionManager - The collision manager instance
 */
export function setupCollisions(collisionManager) {
    // Define which layers can collide with each other

    collisionManager.addLayerRule("player_attack", "enemy");
    collisionManager.addLayerRule("player_attack", "enemy_projectile");
    collisionManager.addLayerRule("enemy_attack", "player");
    collisionManager.addLayerRule("enemy_projectile", "player");

    // Door collision rules
    collisionManager.addLayerRule("player", "door");
    collisionManager.addLayerRule("player_attack", "door");
    collisionManager.addLayerRule("enemy", "door");


    // Player attack hitting enemy = enemy takes damage + knockback
    collisionManager.onCollision("player_attack", "enemy", (hitbox, enemy, overlap) => {
        // Only damage if not already hit by this attack
        if (!hitbox.hasHit(enemy)) {
            hitbox.markHit(enemy);

            if (enemy.takeDamage) {
                enemy.takeDamage(hitbox.damage);
            }

            // Screen shake + hit freeze on hit
            if (hitbox.owner.game.camera) {
                hitbox.owner.game.camera.shake(5, 0.15);
            }
            if (hitbox.owner.game.freeze) {
                hitbox.owner.game.freeze(0.05);
            }

            // Charge dream meter on hit (only outside dream state)
            if (hitbox.owner.dreamMeter !== undefined && !hitbox.owner.inDreamState) {
                hitbox.owner.dreamMeter = Math.min(
                    hitbox.owner.dreamMeterMax,
                    hitbox.owner.dreamMeter + hitbox.owner.dreamMeterChargePerHit
                );
            }

            // Apply knockback
            if (hitbox.knockback) {
                const dx = enemy.x - hitbox.owner.x;
                const dy = enemy.y - hitbox.owner.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;

                // Normalize and apply knockback
                enemy.x += (dx / dist) * hitbox.knockback * 0.1;
                enemy.y += (dy / dist) * hitbox.knockback * 0.1;
            }
        }
    });

    // Player attack destroying enemy projectiles
    collisionManager.onCollision("player_attack", "enemy_projectile", (hitbox, projectile, overlap) => {
        projectile.removeFromWorld = true;
    });

    // enemy attacking player
    collisionManager.onCollision("enemy_attack", "player", (hitbox, player, overlap) => {
    
    if (!hitbox.hasHit(player)) {
        hitbox.markHit(player);

        if (player.takeDamage) {
            player.takeDamage(hitbox.damage);
        }

        //hitbox.removeFromWorld = true;
    }
});

    // Player attack hitting door = deal one hit of damage
    collisionManager.onCollision("player_attack", "door", (hitbox, door) => {
        if (!hitbox.hasHit(door)) {
            hitbox.markHit(door);
            door.takeDamage(1);
        }
    });

    // Enemies are physically blocked by doors (resolveCollision handles the push-back).
    // No extra handler needed.

    // Enemy projectile hitting player
    collisionManager.onCollision("enemy_projectile", "player", (projectile, player, overlap) => {
        if (projectile.removeFromWorld) return;
        if (projectile.hasHit && projectile.hasHit(player)) return;
        if (projectile.markHit) projectile.markHit(player);

        if (player.takeDamage) {
            player.takeDamage(projectile.damage ?? 5);
        }

        projectile.removeFromWorld = true;
    });
}
