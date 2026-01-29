
class Animator {
    constructor( name) {
        this.spriteAtlas = assetManager; // SpriteAtlas or null
        this.name = name; // object type name
        this.direction = "none"; // "left" | "right" | "none"
        this.currAnimationName = "idle";
        this.currAnimationTransform = this.spriteAtlas.getAnimationSize(name);
        this.currentFrame = 0;
        this.speed = 0.1; // seconds per frame
        this.isLooping = true;
        this.is_outline = false;
        this.transparency = 1.0;
        this._frameTimer = 0;
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
        var anim = this.spriteAtlas.metadata[this.currAnimationName];
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
        }
    };

    draw (ctx, x, y) {
        ctx.save();
        ctx.globalAlpha = this.transparency;

        var w = this.currAnimationTransform.w;
        var h = this.currAnimationTransform.h;

        if (!this.spriteAtlas || !this.spriteAtlas.metadata) {
            ctx.strokeStyle = this.is_outline ? "#f00" : "#888";
            ctx.strokeRect(x, y, w, h);
            ctx.fillStyle = "#ccc";
            ctx.fillRect(x, y, w, h);
            ctx.fillStyle = "#000";
            ctx.fillText("anim", x + 2, y + 16);
            ctx.restore();
            return;
        }

        var anim = this.spriteAtlas.metadata[this.currAnimationName];
        if (!anim) {
            ctx.restore();
            return;
        }

        // If spriteSheet image exists, draw the actual sprite
        if (this.spriteAtlas.spriteSheet) {
            var sourceX = this.currentFrame * anim.frameWidth;
            var sourceY = anim.yStart;

            // Handle direction flipping if needed
            if (this.direction === "left") {
                ctx.scale(-1, 1);
                ctx.drawImage(
                    this.spriteAtlas.spriteSheet,
                    sourceX, sourceY, anim.frameWidth, anim.frameHeight,
                    -x - w, y, w, h
                );
            } else {
                ctx.drawImage(
                    this.spriteAtlas.spriteSheet,
                    sourceX, sourceY, anim.frameWidth, anim.frameHeight,
                    x, y, w, h
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