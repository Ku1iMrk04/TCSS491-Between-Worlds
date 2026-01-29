
// Collider component for collision detection
class Collider {
    constructor(options = {}) {
        this.offset = options.offset || { x: 0, y: 0 };
        this.size = options.size || { width: 32, height: 32 };
        this.type = options.type || "box";  // "box" or "circle"
        this.layer = options.layer || "default";
        this.isTrigger = options.isTrigger || false;  // false = solid, true = pass-through
    }

    /**
     * Get the bounding box of this collider in world space
     * @param {number} entityX - Entity's x position
     * @param {number} entityY - Entity's y position
     * @returns {Object} {left, right, top, bottom}
     */
    getBounds(entityX, entityY) {
        return {
            left: entityX + this.offset.x,
            right: entityX + this.offset.x + this.size.width,
            top: entityY + this.offset.y,
            bottom: entityY + this.offset.y + this.size.height
        };
    }

    /**
     * Check if this collider intersects with another (AABB collision)
     * @param {Collider} other - Other collider
     * @param {number} thisX - This entity's x position
     * @param {number} thisY - This entity's y position
     * @param {number} otherX - Other entity's x position
     * @param {number} otherY - Other entity's y position
     * @returns {boolean} True if colliding
     */
    intersects(other, thisX, thisY, otherX, otherY) {
        const a = this.getBounds(thisX, thisY);
        const b = other.getBounds(otherX, otherY);

        return a.left < b.right &&
               a.right > b.left &&
               a.top < b.bottom &&
               a.bottom > b.top;
    }
}

export default Collider;
