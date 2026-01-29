
import { Timer } from "./timer.js";
import { requestAnimFrame } from "./util.js";
import CollisionManager from "./src/collision/collisionmanager.js";
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
        const getXandY = e => ({
            x: e.clientX - this.ctx.canvas.getBoundingClientRect().left,
            y: e.clientY - this.ctx.canvas.getBoundingClientRect().top
        });
        
        this.ctx.canvas.addEventListener("mousemove", e => {
            if (this.options.debugging) {
                console.log("MOUSE_MOVE", getXandY(e));
            }
            this.mouse = getXandY(e);
        });

        this.ctx.canvas.addEventListener("click", e => {
            if (this.options.debugging) {
                console.log("CLICK", getXandY(e));
            }
            this.click = getXandY(e);
        });

        this.ctx.canvas.addEventListener("wheel", e => {
            if (this.options.debugging) {
                console.log("WHEEL", getXandY(e), e.wheelDelta);
            }
            e.preventDefault(); // Prevent Scrolling
            this.wheel = e;
        });

        this.ctx.canvas.addEventListener("contextmenu", e => {
            if (this.options.debugging) {
                console.log("RIGHT_CLICK", getXandY(e));
            }
            e.preventDefault(); // Prevent Context Menu
            this.rightclick = getXandY(e);
        });

        window.addEventListener("keydown", event => {
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
            }
        });

        window.addEventListener("keyup", event => {
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
            }
        });
    };

    addEntity(entity) {
        this.entities.push(entity);
    };

    draw() {
        // Clear the whole canvas with transparent color (rgba(0, 0, 0, 0))
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        // Draw latest things first
        for (let i = this.entities.length - 1; i >= 0; i--) {
            this.entities[i].draw(this.ctx, this);
        }
    };

    update() {
        let entitiesCount = this.entities.length;

        for (let i = 0; i < entitiesCount; i++) {
            let entity = this.entities[i];

            if (!entity.removeFromWorld) {
                entity.update();
            }
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
        this.clockTick = this.timer.tick();
        this.update();
        this.draw();
    };

};

// KV Le was here :)