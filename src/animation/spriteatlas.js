
// SpriteAtlas: handles sprite sheet and animation metadata
function SpriteAtlas() {
    this.spriteSheet = null; // HTMLImageElement or null
    this.metadata = null;    // JSON or null
}

// Returns the size of an animation
SpriteAtlas.prototype.getAnimationSize = function(name) {
    // Example metadata structure:
    // this.metadata = {
    //   "run": { "frames": 6, "size": {"x":32, "y":32} }, ...
    // }
    if (!this.metadata || !this.metadata[name]) return { x: 32, y: 32 };
    return this.metadata[name].size || { x: 32, y: 32 };
};

SpriteAtlas.prototype.getFrame = function(animationName, frameIndex, direction) {
    // Would return frame info from metadata
    // For now, just return null
    return null;
};

export default SpriteAtlas;
