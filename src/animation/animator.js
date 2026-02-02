
class Animator {
    constructor(name, assetManager) {
        this.spriteAtlas = assetManager.getSpriteAtlas("assets/" + name + ".png"); // SpriteAtlas or null
        this.name = name; // object type name
        this.direction = "none"; // "left" | "right" | "none"
        this.currAnimationName = "idle";
        this.scale = 4
        // Safety check before calling getAnimationSize
        if (this.spriteAtlas && this.spriteAtlas.metadata && this.spriteAtlas.metadata.animations) {
            this.currAnimationTransform = this.spriteAtlas.getAnimationSize("idle");
        } else {
            console.warn("SpriteAtlas or metadata not loaded for:", name);
            this.currAnimationTransform = { w: 32, h: 32 }; // fallback
        }

        this.currentFrame = 0;
        this.speed = 0.3; // seconds per frame
        this.isLooping = true;
        this.is_outline = false;
        this.transparency = 1.0;
        this._frameTimer = 0;
        this.frameGap = this.spriteAtlas.getFrameGap();
        this.initialFrameGap = this.frameGap - this.spriteAtlas.marginWidth;
        console.log("Animator created:", {
            name: this.name,
            hasAtlas: !!this.spriteAtlas,
            hasMetadata: !!(this.spriteAtlas && this.spriteAtlas.metadata),
            hasSpriteSheet: !!(this.spriteAtlas && this.spriteAtlas.spriteSheet),
            transform: this.currAnimationTransform
        });
    }

    setAnimation(name, speed = this.speed, direction = this.direction, looping = this.isLooping) {
        this.currAnimationName = name;
        this.currentFrame = 0;
        this.currentAnimationTransform = this.spriteAtlas.getAnimationSize(name);
        this.speed = speed;
        this.direction = direction;
        this.isLooping = looping;
        this._frameTimer = 0;
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

        if (!this.spriteAtlas || !this.spriteAtlas.metadata) {
            console.log("Drawing fallback - no atlas/metadata");
            ctx.strokeStyle = this.is_outline ? "#f00" : "#888";
            ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = "#ccc";
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = "#000";
            ctx.fillText("anim", x + 2, y + 16);
            ctx.restore();
            return;
        }

        var anim = this.spriteAtlas.metadata.animations[this.currAnimationName];
        if (!anim) {
            ctx.restore();
            return;
        }

        // If spriteSheet image exists, draw the actual sprite
        if (this.spriteAtlas.spriteSheet) {
            // Each frame is 37x37 (35px sprite + 2px total padding)
            // Skip 1px padding on left and top

            var sourceX = this.currentFrame * (anim.frameWidth + this.frameGap) + this.initialFrameGap;

            var sourceY = anim.yStart + 2;
            console.log("Frame changed to:", this.currentFrame, "| sourceX:", sourceX, "sourceY:", anim.yStart, "| animation:", this.currAnimationName);

            // Handle direction flipping if needed
            if (this.direction === "left") {
                ctx.scale(-1, 1);
                ctx.drawImage(
                    this.spriteAtlas.spriteSheet,
                    sourceX , sourceY, anim.frameWidth, anim.frameHeight,
                    -x - w, y, w, h
                );
            } else {
                ctx.drawImage(
                    this.spriteAtlas.spriteSheet,
                    sourceX , sourceY,
                    anim.frameWidth, anim.frameHeight,
                    x, y, w , h
                );
            }

            // Draw outline if enabled
            if (this.is_outline) {
                ctx.strokeStyle = "#0f0";
                ctx.strokeRect(x, y, w, h);
            }
        } else {
            // Fallback: draw placeholder if metadata exists but no sprite image
            ctx.strokeStyle = this.is_outline ? "#0f0" : "#888";
            ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = "#99f";
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = "#fff";
            ctx.fillText(this.currAnimationName, x + 2, y + 16);
        }

        ctx.restore();
    };
};

export default Animator;