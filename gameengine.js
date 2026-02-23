
import { Timer } from "./timer.js";
import { requestAnimFrame } from "./util.js";
import CollisionManager from "./src/collision/collisionmanager.js";
import Camera from "./src/camera.js";
// This game shell was happily modified from Googler Seth Ladd's "Bad Aliens" game and his Google IO talk in 2011

export class GameEngine {
    constructor(options) {
        // What you will use to draw
        // Documentation: https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D
        this.ctx = null;

        // Everything that will be updated and drawn each frame
        this.entities = [];

        // Collision detection
        this.collisionManager = new CollisionManager();

        // Camera (will be initialized when map loads)
        this.camera = null;

        // Information on the input
        this.click = null;
        this.mouse = null;
        this.wheel = null;

        // Universal input flags
        this.left = false;
        this.right = false;
        this.up = false;
        this.down = false;
        this.space = false;
        this.shift = false;

        // Scenes
        this.sceneManager = null;
        this.menuBgImage = null;

        // Slow-mo support
        this.timeScale = 1;
        this.rawClockTick = 0;

        // Mouse button tracking
        this.rightMouseDown = false;
        this.rightMouseReleased = false;
        this.leftMouseDown = false;
        this.leftMouseReleased = false;

        // Options and the Details
        this.options = options || {
            debugging: false,
        };
    };

    init(ctx) {
        this.ctx = ctx;
        this.startInput();
        this.timer = new Timer();
    };

    start() {
        this.running = true;
        const gameLoop = () => {
            this.loop();
            requestAnimFrame(gameLoop, this.ctx.canvas);
        };
        gameLoop();
    };

    startInput() {
        const getXandY = e => {
            const rect = this.ctx.canvas.getBoundingClientRect();
            const scaleX = this.ctx.canvas.width / rect.width;
            const scaleY = this.ctx.canvas.height / rect.height;
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        };
        
        this.ctx.canvas.addEventListener("mousemove", e => {
            this.mouse = getXandY(e);
        });

        this.ctx.canvas.addEventListener("mousedown", e => {
            const pos = getXandY(e);
            if (e.button === 0) {
                if (this.options.debugging) {
                    console.log("MOUSEDOWN", pos);
                }
                this.click = pos;
                this.leftMouseDown = true;
                this.leftMouseReleased = false;

                // scene click forwarding
                if (this.sceneManager) {
                    this.sceneManager.onClick(pos.x, pos.y);
                }
            } else if (e.button === 2) {
                this.rightMouseDown = true;
                this.rightclick = pos;
            }
        });

        this.ctx.canvas.addEventListener("wheel", e => {
            e.preventDefault(); // Prevent Scrolling
            this.wheel = e;
        });

        this.ctx.canvas.addEventListener("mouseup", e => {
            if (e.button === 0) {
                this.leftMouseDown = false;
                this.leftMouseReleased = true;
            } else if (e.button === 2) {
                this.rightMouseDown = false;
                this.rightMouseReleased = true;
            }
        });

        this.ctx.canvas.addEventListener("contextmenu", e => {
            e.preventDefault(); // Prevent Context Menu
        });

        window.addEventListener("keydown", event => {
            
            if (this.sceneManager) {
                this.sceneManager.onKeyDown(event);
            }

            switch (event.code) {
                case "KeyA":
                case "ArrowLeft":
                    this.left = true;
                    break;
                case "KeyD":
                case "ArrowRight":
                    this.right = true;
                    break;
                case "KeyW":
                case "ArrowUp":
                    this.up = true;
                    break;
                case "KeyS":
                case "ArrowDown":
                    this.down = true;
                    break;
                case "Space":
                    this.space = true;
                    break;
                case "ShiftLeft":
                    this.shift = true;
                    break;
                case "KeyE":
                    this.eKey = true;
                    break;
            }
        });

        window.addEventListener("keyup", event => {

            if (this.sceneManager) {
                this.sceneManager.onKeyUp(event);
            }

            switch (event.code) {
                case "KeyA":
                case "ArrowLeft":
                    this.left = false;
                    break;
                case "KeyD":
                case "ArrowRight":
                    this.right = false;
                    break;
                case "KeyW":
                case "ArrowUp":
                    this.up = false;
                    break;
                case "KeyS":
                case "ArrowDown":
                    this.down = false;
                    break;
                case "Space":
                    this.space = false;
                    break;
                case "ShiftLeft":
                    this.shift = false;
                    break;
                case "KeyE":
                    this.eKey = false;
                    break;
            }
        });
    };

    addEntity(entity) {
        this.entities.push(entity);
    };

    isGamePlayScene() {
        return !!(this.sceneManager && this.sceneManager.currentScene && this.sceneManager.currentScene.isGameplay);
    }

    draw() {
        // Clear the whole canvas with transparent color (rgba(0, 0, 0, 0))
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // if not gameplay, let the scene fully draw and return
        if (this.sceneManager && !this.isGamePlayScene()) {
            this.sceneManager.draw(this.ctx);
            return;
        }

        // Draw scene (background, tilemap, etc.) first
        const scene = this.sceneManager?.currentScene;
        if (scene && scene.draw) scene.draw(this.ctx);

        // Scale factor for map rendering (canvas is 1920x1080, viewport is 960x540)
        const scale = 2;

        // Draw entities scaled and with camera transform
        this.ctx.save();
        this.ctx.scale(scale, scale);

        // Apply camera transform to entities
        if (this.camera) {
            this.camera.applyTransform(this.ctx);
        }

        for (let i = this.entities.length - 1; i >= 0; i--) {
            this.entities[i].draw(this.ctx, this);
        }
        this.ctx.restore();
    };

    update() {
        // always update current scene logic
        if (this.sceneManager) {
            this.sceneManager.update(this);
        }

        // if not gameplay, skip entity updates/collisions
        if (this.sceneManager && !this.isGamePlayScene()) {
            return;
        }

        let entitiesCount = this.entities.length;

        for (let i = 0; i < entitiesCount; i++) {
            let entity = this.entities[i];

            if (!entity.removeFromWorld) {
                entity.update();
            }
        }

        // Update camera after entities have moved
        if (this.camera) {
            this.camera.update(this.clockTick);
        }

        // Check collisions after all entities have moved
        this.collisionManager.checkAllCollisions(this.entities);

        for (let i = this.entities.length - 1; i >= 0; --i) {
            if (this.entities[i].removeFromWorld) {
                this.entities.splice(i, 1);
            }
        }
    };

    loop() {
        this.rawClockTick = this.timer.tick();
        this.clockTick = this.rawClockTick * this.timeScale;
        this.update();
        this.draw();
    };

};

// KV Le was here :)