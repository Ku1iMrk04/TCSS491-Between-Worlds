
// Collider component for collision detection
class Collider {
    constructor(options = {}) {
        this.offset = options.offset || { x: 0, y: 0 };
        this.size = options.size || { width: 32, height: 32 };
        this.type = options.type || "box";  // "box" or "circle"
        this.layer = options.layer || "default";
        this.isTrigger = options.isTrigger || false;  // false = solid, true = pass-through
        this.angle = options.angle || 0;  // rotation in radians (OBB support)
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
     * Check if this collider intersects with another.
     * Uses OBB-vs-AABB SAT if either collider has a non-zero angle.
     */
    intersects(other, thisX, thisY, otherX, otherY) {
        if (this.angle) {
            return this._obbVsAabb(other, thisX, thisY, otherX, otherY);
        }
        if (other.angle) {
            return other._obbVsAabb(this, otherX, otherY, thisX, thisY);
        }
        const a = this.getBounds(thisX, thisY);
        const b = other.getBounds(otherX, otherY);
        return a.left < b.right &&
               a.right > b.left &&
               a.top < b.bottom &&
               a.bottom > b.top;
    }

    /**
     * OBB (this, rotated) vs AABB (other) using Separating Axis Theorem.
     * Tests 4 axes: the two OBB local axes and the two world axes.
     */
    _obbVsAabb(aabb, obbX, obbY, aabbX, aabbY) {
        const hw = this.size.width / 2;
        const hh = this.size.height / 2;
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);

        // OBB center in world space
        const cx = obbX + this.offset.x + hw;
        const cy = obbY + this.offset.y + hh;

        // AABB center and half-extents
        const ab = aabb.getBounds(aabbX, aabbY);
        const ax = (ab.left + ab.right) / 2;
        const ay = (ab.top + ab.bottom) / 2;
        const ahw = (ab.right - ab.left) / 2;
        const ahh = (ab.bottom - ab.top) / 2;

        const dx = cx - ax;
        const dy = cy - ay;

        // Axis 1: OBB local X (cos, sin)
        if (Math.abs(dx * cos + dy * sin) > hw + ahw * Math.abs(cos) + ahh * Math.abs(sin)) return false;
        // Axis 2: OBB local Y (-sin, cos)
        if (Math.abs(dx * -sin + dy * cos) > hh + ahw * Math.abs(sin) + ahh * Math.abs(cos)) return false;
        // Axis 3: World X
        if (Math.abs(dx) > ahw + hw * Math.abs(cos) + hh * Math.abs(sin)) return false;
        // Axis 4: World Y
        if (Math.abs(dy) > ahh + hw * Math.abs(sin) + hh * Math.abs(cos)) return false;

        return true;
    }
}

export default Collider;
