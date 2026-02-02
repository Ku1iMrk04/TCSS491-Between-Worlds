
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
        return {
            w: this.metadata.animations[animationName].frameWidth,
            h: this.metadata.animations[animationName].frameHeight
        }

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
