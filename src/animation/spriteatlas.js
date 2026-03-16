
// SpriteAtlas: handles sprite sheet and animation metadata
class SpriteAtlas {
    constructor(spriteSheet, metadata) {
        this.spriteSheet = spriteSheet; // HTMLImageElement or null
        this.metadata = metadata;    // JSON or null
        this.marginWidth = metadata?.marginWidth ?? 0;
        this.marginHeight = metadata?.marginHeight ?? 0;
        this.xLineWidth = metadata?.xLineWidth ?? 0;
        this.yLineWidth = metadata?.yLineWidth ?? 0;
    }

    getAnimation(animationName) {
        return this.metadata?.animations?.[animationName] ?? null;
    }

    // Returns the size of an animation
    getAnimationSize(animationName) {
        const animation = this.getAnimation(animationName);
        if (!animation) {
            console.warn(`Animation "${animationName}" not found in metadata`);
            return { w: 32, h: 32 }; // fallback size
        }

        if (Number.isFinite(animation.frameWidth) && Number.isFinite(animation.frameHeight)) {
            return {
                w: animation.frameWidth,
                h: animation.frameHeight
            };
        }

        if (Array.isArray(animation.frames) && animation.frames.length > 0) {
            let maxWidth = 0;
            let maxHeight = 0;

            for (const frame of animation.frames) {
                const frameWidth = frame.w ?? frame.width ?? 0;
                const frameHeight = frame.h ?? frame.height ?? 0;
                maxWidth = Math.max(maxWidth, frameWidth);
                maxHeight = Math.max(maxHeight, frameHeight);
            }

            return {
                w: maxWidth || 32,
                h: maxHeight || 32
            };
        }

        return {
            w: 32,
            h: 32
        };
    }

    hasAnimation(animationName) {
        return this.getAnimation(animationName) !== null;
    }

    getFrameGap() {
        return (this.marginWidth * 2) + this.xLineWidth;
    }

    getInitialFrameOffsetX() {
        if (!this.metadata) return 0;
        if (Number.isFinite(this.metadata.initialFrameOffsetX)) {
            return this.metadata.initialFrameOffsetX;
        }
        return this.marginWidth + this.xLineWidth;
    }

    getInitialFrameOffsetY() {
        if (!this.metadata) return 0;
        if (Number.isFinite(this.metadata.initialFrameOffsetY)) {
            return this.metadata.initialFrameOffsetY;
        }
        return this.marginHeight + this.yLineWidth;
    }

    getFrameSource(animationName, frameIndex) {
        const animation = this.getAnimation(animationName);
        if (!animation) {
            return null;
        }

        if (Array.isArray(animation.frames) && animation.frames.length > 0) {
            const clampedIndex = Math.max(0, Math.min(animation.frames.length - 1, frameIndex));
            const frame = animation.frames[clampedIndex];
            return {
                x: frame.x ?? frame.sourceX ?? 0,
                y: frame.y ?? frame.sourceY ?? 0,
                w: frame.w ?? frame.width ?? animation.frameWidth ?? 32,
                h: frame.h ?? frame.height ?? animation.frameHeight ?? 32
            };
        }

        const hasExplicitX = Number.isFinite(animation.xStart) ||
            Number.isFinite(animation.sourceX) ||
            Number.isFinite(animation.x);
        const hasExplicitY = Number.isFinite(animation.yStart) ||
            Number.isFinite(animation.sourceY) ||
            Number.isFinite(animation.y);
        const stepX = Number.isFinite(animation.xStride)
            ? animation.xStride
            : Number.isFinite(animation.frameStepX)
            ? animation.frameStepX
            : hasExplicitX
                ? animation.frameWidth
                : animation.frameWidth + this.getFrameGap();
        const stepY = Number.isFinite(animation.frameStepY)
            ? animation.frameStepY
            : 0;
        const sourceXBase = Number.isFinite(animation.xStart)
            ? animation.xStart
            : Number.isFinite(animation.sourceX)
            ? animation.sourceX
            : Number.isFinite(animation.x)
                ? animation.x
                : this.getInitialFrameOffsetX();
        const sourceYBase = Number.isFinite(animation.yStart)
            ? animation.yStart
            : Number.isFinite(animation.sourceY)
            ? animation.sourceY
            : Number.isFinite(animation.y)
                ? animation.y
                : (animation.yStart ?? 0) + (hasExplicitY ? 0 : this.getInitialFrameOffsetY());

        return {
            x: sourceXBase + (frameIndex * stepX),
            y: sourceYBase + (frameIndex * stepY),
            w: animation.frameWidth,
            h: animation.frameHeight
        };
    }

    // getFrame(animationName, frameIndex, direction) {
    //     // Would return frame info from metadata
    //     // For now, just return null
    //     return null;
    // }
}

export default SpriteAtlas;
