
// SpriteAtlas: handles sprite sheet and animation metadata
class SpriteAtlas {
    constructor(spriteSheet, metadata) {
        this.spriteSheet = spriteSheet; // HTMLImageElement or null
        this.metadata = metadata;    // JSON or null
        this.marginWidth = metadata ? metadata.marginWidth : 0;
        this.marginHeight = metadata ? metadata.marginHeight : 0;
        this.xLineWidth = metadata ? metadata.xLineWidth : 0;
        this.yLineWidth = metadata ? metadata.yLineWidth : 0;
    }


// Returns the size of an animation
    getAnimationSize(animationName) {
        if (!this.metadata || !this.metadata.animations || !this.metadata.animations[animationName]) {
            console.warn(`Animation "${animationName}" not found in metadata`);
            return { w: 32, h: 32 }; // fallback size
        }
        return {
            w: this.metadata.animations[animationName].frameWidth,
            h: this.metadata.animations[animationName].frameHeight
        }
    }

    hasAnimation(animationName) {
        return this.metadata && this.metadata.animations && this.metadata.animations[animationName] !== undefined;
    }
    getFrameGap(){
        return (this.marginWidth * 2) + this.xLineWidth;
    }

    // getFrame(animationName, frameIndex, direction) {
    //     // Would return frame info from metadata
    //     // For now, just return null
    //     return null;
    // }
}

export default SpriteAtlas;
