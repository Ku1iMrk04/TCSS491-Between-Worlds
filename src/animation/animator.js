
class Animator {
    constructor(name, assetManager) {
        this.assetManager = assetManager;

        this.spriteAtlas = this.assetManager.getSpriteAtlas("assets/" + name + ".png"); // SpriteAtlas or null
        this.name = name; // object type name
        this.direction = "none"; // "left" | "right" | "none"
        this.currAnimationName = "idle";
        this.scale = 1;
        this.fallbackImage = this.assetManager.getAsset("assets/NoSpriteBudda.png"); // Fallback image
        this.animationMissing = false; // Track if current animation is missing
        this.verticalAdjustment = 0; // Custom vertical offset (can be set per-entity)

        // Safety check before calling getAnimationSize
        if (this.spriteAtlas && this.spriteAtlas.metadata && this.spriteAtlas.metadata.animations) {
            this.currAnimationTransform = this.spriteAtlas.getAnimationSize("idle");
            // Calculate the maximum height across all animations for bottom-alignment
            this.maxAnimationHeight = this.calculateMaxAnimationHeight();
        } else {
            console.warn("SpriteAtlas or metadata not loaded for:", name);
            this.currAnimationTransform = { w: 32, h: 32 }; // fallback
            this.maxAnimationHeight = 32;
        }

        this.currentFrame = 0;
        this.speed = 0.1; // seconds per frame (lower = faster)
        this.isLooping = true;
        this.is_outline = false;
        this.transparency = 1.0;
        this._frameTimer = 0;
        this.frameGap = this.spriteAtlas.getFrameGap();
        this.initialFrameGap = this.frameGap - this.spriteAtlas.marginWidth;
    }

    /**
     * Calculate the maximum frame height across all animations
     * Used for bottom-aligning sprites with different heights
     */
    calculateMaxAnimationHeight() {
        if (!this.spriteAtlas || !this.spriteAtlas.metadata || !this.spriteAtlas.metadata.animations) {
            return 32; // fallback
        }

        let maxHeight = 0;
        const animations = this.spriteAtlas.metadata.animations;

        for (const animName in animations) {
            const anim = animations[animName];
            if (anim.frameHeight > maxHeight) {
                maxHeight = anim.frameHeight;
            }
        }

        return maxHeight;
    }

    setAnimation(name,  direction = this.direction, looping = this.isLooping) {
        // Check if animation exists
        if (this.spriteAtlas && this.spriteAtlas.hasAnimation(name)) {
            this.currAnimationName = name;
            this.currentFrame = 0;
            this.currAnimationTransform = this.spriteAtlas.getAnimationSize(name);
            this.direction = direction;
            this.isLooping = looping;
            this._frameTimer = 0;
            this.animationMissing = false;
        } else {
            this.animationMissing = true;
            this.currAnimationName = name; // Still track what was requested
        }
    };

    setTransparency(percentage) {
        this.transparency = Math.max(0, Math.min(1, percentage / 100));
    };

    setDirection(direction) {
        this.direction = direction;
    };
    setSpeed (speed) {
        this.speed = speed;
    };
    setLooping (should_loop) {
        this.isLooping = !!should_loop;
    };

    showOutline(is_outline) {
        this.is_outline = !!is_outline;
    };
    setScale(scale) {
        this.scale = scale;
    };

    setVerticalAdjustment(offset) {
        this.verticalAdjustment = offset;
    };

    update(dt) {
        // Advance frames based on dt and speed
        this._frameTimer += dt;

        if (!this.spriteAtlas || !this.spriteAtlas.metadata) return;
        var anim = this.spriteAtlas.metadata.animations[this.currAnimationName];
        if (!anim) return;

        var frameCount = anim.frameCount;

        if (this._frameTimer >= this.speed) {
            this.currentFrame++;
            this._frameTimer = 0;
            if (this.currentFrame >= frameCount) {
                if (this.isLooping) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = frameCount - 1;
                }
            }

            // Log when frame changes with coordinates
            var sourceX = this.currentFrame * (anim.frameWidth + 3) + 2;
            //console.log("Frame changed to:", this.currentFrame, "| sourceX:", sourceX, "sourceY:", anim.yStart, "| animation:", this.currAnimationName);
        }
    };

    draw (ctx, x, y) {
        ctx.save();
        ctx.globalAlpha = this.transparency;

        // Disable image smoothing for crisp pixel art
        ctx.imageSmoothingEnabled = false;

        var w = this.currAnimationTransform.w * this.scale;
        var h = this.currAnimationTransform.h * this.scale;

        // Calculate Y offset to bottom-align sprite based on max animation height
        // This ensures all animations align to the same ground level
        var maxHeight = this.maxAnimationHeight * this.scale;
        var yOffset = maxHeight - h;

        // Apply custom vertical adjustment (set per-entity)
        yOffset += this.verticalAdjustment;

        if (!this.spriteAtlas || !this.spriteAtlas.metadata) {
            console.log("Drawing fallback - no atlas/metadata");
            ctx.strokeStyle = this.is_outline ? "#f00" : "#888";
            ctx.strokeRect(x, y + yOffset, w, h);
            ctx.fillStyle = "#ccc";
            ctx.fillRect(x, y + yOffset, w, h);
            ctx.fillStyle = "#000";
            ctx.fillText("anim", x + 2, y + yOffset + 16);
            ctx.restore();
            return;
        }

        var anim = this.spriteAtlas.metadata.animations[this.currAnimationName];

        // If animation is missing, draw NoSpriteBudda.png fallback
        if (!anim || this.animationMissing) {
            if (this.fallbackImage) {
                ctx.drawImage(this.fallbackImage, x, y + yOffset, w, h);
                // Draw text showing which animation was requested
                ctx.fillStyle = "#ff0";
                ctx.font = "12px monospace";
                ctx.fillText(`Missing: ${this.currAnimationName}`, x, y + yOffset - 5);
            } else {
                // Ultimate fallback if NoSpriteBudda.png isn't loaded
                ctx.strokeStyle = "#f00";
                ctx.strokeRect(x, y + yOffset, w, h);
                ctx.fillStyle = "#fcc";
                ctx.fillRect(x, y + yOffset, w, h);
                ctx.fillStyle = "#f00";
                ctx.fillText(`Missing: ${this.currAnimationName}`, x + 2, y + yOffset + 16);
            }
            ctx.restore();
            return;
        }

        // If spriteSheet image exists, draw the actual sprite
        if (this.spriteAtlas.spriteSheet) {
            // Each frame is 37x37 (35px sprite + 2px total padding)
            // Skip 1px padding on left and top

            var sourceX = this.currentFrame * (anim.frameWidth + this.frameGap) + this.initialFrameGap;

            var sourceY = anim.yStart + 2;
            // console.log("Frame changed to:", this.currentFrame, "| sourceX:", sourceX, "sourceY:", anim.yStart, "| animation:", this.currAnimationName);

            // Handle direction flipping if needed
            if (this.direction === "left") {
                ctx.scale(-1, 1);
                ctx.drawImage(
                    this.spriteAtlas.spriteSheet,
                    sourceX , sourceY, anim.frameWidth, anim.frameHeight,
                    -x - w, y + yOffset, w, h
                );
            } else {
                ctx.drawImage(
                    this.spriteAtlas.spriteSheet,
                    sourceX , sourceY,
                    anim.frameWidth, anim.frameHeight,
                    x, y + yOffset, w , h
                );
            }

            // Draw outline if enabled
            if (this.is_outline) {
                ctx.strokeStyle = "#0f0";
                ctx.strokeRect(x, y + yOffset, w, h);
            }
        } else {
            // Fallback: draw placeholder if metadata exists but no sprite image
            ctx.strokeStyle = this.is_outline ? "#0f0" : "#888";
            ctx.strokeRect(x, y + yOffset, w, h);
            ctx.fillStyle = "#99f";
            ctx.fillRect(x, y + yOffset, w, h);
            ctx.fillStyle = "#fff";
            ctx.fillText(this.currAnimationName, x + 2, y + yOffset + 16);
        }

        ctx.restore();
    };
};

export default Animator;