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
    collisionManager.addLayerRule("player", "enemy");
    collisionManager.addLayerRule("player_attack", "enemy");
    collisionManager.addLayerRule("enemy_attack", "player");

    // Player touching enemy = player takes damage
    collisionManager.onCollision("player", "enemy", (player, enemy, overlap) => {
        if (player.takeDamage) {
            player.takeDamage(enemy.damage || 10);
        }
    });

    // Player attack hitting enemy = enemy takes damage + knockback
    collisionManager.onCollision("player_attack", "enemy", (hitbox, enemy, overlap) => {
        // Only damage if not already hit by this attack
        if (!hitbox.hasHit(enemy)) {
            hitbox.markHit(enemy);

            if (enemy.takeDamage) {
                enemy.takeDamage(hitbox.damage);
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
}
