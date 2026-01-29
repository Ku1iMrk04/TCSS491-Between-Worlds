
// SpriteAtlas: handles sprite sheet and animation metadata
class SpriteAtlas {
    constructor(spriteSheet, metadata) {
        this.spriteSheet = spriteSheet; // HTMLImageElement or null
        this.metadata = metadata;    // JSON or null
    }


// Returns the size of an animation
    getAnimationSize(animationName) {
        return {
            w: this.metadata[animationName].frameWidth,
            h: this.metadata[animationName].frameHeight
        }

    }

    // getFrame(animationName, frameIndex, direction) {
    //     // Would return frame info from metadata
    //     // For now, just return null
    //     return null;
    // }
}

export default SpriteAtlas;
