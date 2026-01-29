
// Manages collision detection between entities
class CollisionManager {
    constructor() {
        // Map of layer -> array of layers it collides with
        this.collisionMatrix = new Map();
        // Map of "layer1:layer2" -> callback function
        this.collisionHandlers = new Map();
    }

    /**
     * Register a callback for when two specific layers collide
     * @param {string} layer1 - First layer name
     * @param {string} layer2 - Second layer name
     * @param {Function} callback - Function(entityA, entityB, overlap) called on collision
     */
    onCollision(layer1, layer2, callback) {
        // Store handler with consistent key (alphabetically sorted)
        const key = this._getHandlerKey(layer1, layer2);
        this.collisionHandlers.set(key, { layer1, layer2, callback });
    }

    /**
     * Get consistent key for handler lookup
     * @private
     */
    _getHandlerKey(layer1, layer2) {
        return [layer1, layer2].sort().join(":");
    }

    /**
     * Get the collision handler for two layers
     * @private
     */
    _getHandler(layer1, layer2) {
        const key = this._getHandlerKey(layer1, layer2);
        return this.collisionHandlers.get(key);
    }

    /**
     * Define which layers should collide with each other
     * @param {string} layer1
     * @param {string} layer2
     */
    addLayerRule(layer1, layer2) {
        if (!this.collisionMatrix.has(layer1)) {
            this.collisionMatrix.set(layer1, []);
        }
        if (!this.collisionMatrix.has(layer2)) {
            this.collisionMatrix.set(layer2, []);
        }

        if (!this.collisionMatrix.get(layer1).includes(layer2)) {
            this.collisionMatrix.get(layer1).push(layer2);
        }
        if (!this.collisionMatrix.get(layer2).includes(layer1)) {
            this.collisionMatrix.get(layer2).push(layer1);
        }
    }

    /**
     * Check if two layers should collide
     */
    shouldCollide(layer1, layer2) {
        const layers = this.collisionMatrix.get(layer1);
        return layers && layers.includes(layer2);
    }

    /**
     * Get overlap between two entities
     * @returns {Object} {x, y} overlap amounts
     */
    getOverlap(entityA, entityB) {
        const a = entityA.collider.getBounds(entityA.x, entityA.y);
        const b = entityB.collider.getBounds(entityB.x, entityB.y);

        const overlapX = Math.min(a.right - b.left, b.right - a.left);
        const overlapY = Math.min(a.bottom - b.top, b.bottom - a.top);

        return { x: overlapX, y: overlapY };
    }

    /**
     * Resolve solid collision by pushing entities apart
     */
    resolveCollision(entityA, entityB, overlap) {
        // Skip if either is a trigger (pass-through)
        if (entityA.collider.isTrigger || entityB.collider.isTrigger) {
            return;
        }

        // Push along the axis with smallest overlap
        if (overlap.x < overlap.y) {
            // Push horizontally
            const pushX = overlap.x / 2;
            if (entityA.x < entityB.x) {
                entityA.x -= pushX;
                entityB.x += pushX;
            } else {
                entityA.x += pushX;
                entityB.x -= pushX;
            }
        } else {
            // Push vertically
            const pushY = overlap.y / 2;
            if (entityA.y < entityB.y) {
                entityA.y -= pushY;
                entityB.y += pushY;
            } else {
                entityA.y += pushY;
                entityB.y -= pushY;
            }
        }
    }

    /**
     * Check all entities for collisions
     * @param {Array} entities - Array of game entities
     * @returns {Array} Array of collision pairs [{a, b, overlap}]
     */
    checkAllCollisions(entities) {
        const collisions = [];

        for (let i = 0; i < entities.length; i++) {
            const a = entities[i];
            if (!a.collider) continue;

            for (let j = i + 1; j < entities.length; j++) {
                const b = entities[j];
                if (!b.collider) continue;

                // Check if these layers should collide
                if (!this.shouldCollide(a.collider.layer, b.collider.layer)) {
                    continue;
                }

                // Check intersection
                if (a.collider.intersects(b.collider, a.x, a.y, b.x, b.y)) {
                    const overlap = this.getOverlap(a, b);
                    collisions.push({ a, b, overlap });

                    // Resolve solid collisions
                    this.resolveCollision(a, b, overlap);

                    // Check for registered layer-pair handler
                    const handler = this._getHandler(a.collider.layer, b.collider.layer);
                    if (handler) {
                        // Ensure entities are passed in correct order (layer1 first)
                        if (a.collider.layer === handler.layer1) {
                            handler.callback(a, b, overlap);
                        } else {
                            handler.callback(b, a, overlap);
                        }
                    } else {
                        // Fall back to entity onCollision methods
                        if (a.onCollision) a.onCollision(b);
                        if (b.onCollision) b.onCollision(a);
                    }
                }
            }
        }

        return collisions;
    }
}

export default CollisionManager;
