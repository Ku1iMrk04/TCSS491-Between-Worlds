
// Animator: controls animation state and drawing
function Animator() {
    this.spriteSheet = null; // SpriteAtlas or null
    this.name = ""; // object type name
    this.direction = "none"; // "left" | "right" | "none"
    this.currAnimationName = "idle";
    this.currAnimationTransform = { x: 0, y: 0, w: 32, h: 32 };
    this.currentFrame = 0;
    this.speed = 0.1; // seconds per frame
    this.isLooping = true;
    this.is_outline = false;
    this.transparency = 1.0;
    this._frameTimer = 0;
}

Animator.prototype.setAnimation = function(name, speed, direction, looping) {
  if (typeof name === "string") this.currAnimationName = name;
  if (typeof speed === "number") this.speed = speed;
  if (typeof direction === "string") this.direction = direction;
  if (typeof looping === "boolean") this.isLooping = looping;

  this.currentFrame = 0;
  this._frameTimer = 0;
};

Animator.prototype.setTransparency = function(percentage) {
    this.transparency = Math.max(0, Math.min(1, percentage / 100));
};

Animator.prototype.setDirection = function(direction) {
    this.direction = direction;
};

Animator.prototype.setSpeed = function(speed) {
    this.speed = speed;
};

Animator.prototype.setLooping = function(should_loop) {
    this.isLooping = !!should_loop;
};

Animator.prototype.showOutline = function(is_outline) {
    this.is_outline = !!is_outline;
};

Animator.prototype.update = function(dt) {
    // Advance frames based on dt and speed
    this._frameTimer += dt;

    if (!this.spriteSheet || !this.spriteSheet.metadata) return;
    var anim = this.spriteSheet.metadata[this.currAnimationName];
    if (!anim) return;

    var frameCount = 1;
    if (Array.isArray(anim.frames)) frameCount = anim.frames.length;
    else if (typeof anim.frames === "number") frameCount = anim.frames;

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

Animator.prototype.draw = function(ctx, x, y) {
    ctx.save();
    ctx.globalAlpha = this.transparency;

    var w = this.currAnimationTransform.w;
    var h = this.currAnimationTransform.h;
    
    if (!this.spriteSheet || !this.spriteSheet.metadata) {
        ctx.strokeStyle = this.is_outline ? "#f00" : "#888";
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = "#ccc";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "#000";
        ctx.fillText("anim", x + 2, y + 16);
        ctx.restore();
        return;
    }
    // Would draw frame from spriteSheet here
    // Example: let frame = this.spriteSheet.getFrame(this.currAnimationName, this.currentFrame, this.direction);
    // ctx.drawImage(...)
    ctx.strokeStyle = this.is_outline ? "#0f0" : "#888";
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "#99f";
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = "#fff";
    ctx.fillText(this.currAnimationName, x + 2, y + 16);
    ctx.restore();
};

export default Animator;
