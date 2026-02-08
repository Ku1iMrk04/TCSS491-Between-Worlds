/**
 * TileMap - Parses and renders Tiled JSON map files
 *
 * Supports:
 * - Tile layers (collision, background, foreground)
 * - Object layers (spawn points, triggers)
 * - Basic collision detection
 */
class TileMap {
    /**
     * @param {Object} mapData - Parsed Tiled JSON data
     * @param {HTMLImageElement} [tileset] - Optional tileset image for rendering
     */
    constructor(mapData, tileset = null) {
        this.width = mapData.width;           // Width in tiles
        this.height = mapData.height;         // Height in tiles
        this.tileWidth = mapData.tilewidth;   // Pixel width of each tile
        this.tileHeight = mapData.tileheight; // Pixel height of each tile

        this.tileset = tileset;
        this.layers = {};
        this.objects = {};

        this.parseLayer(mapData.layers);
    }

    /**
     * Parse all layers from Tiled data
     */
    parseLayer(layers) {
        for (const layer of layers) {
            if (layer.type === "tilelayer") {
                // Convert flat array to 2D grid
                this.layers[layer.name] = this.toGrid(layer.data, this.width);
            } else if (layer.type === "objectgroup") {
                this.objects[layer.name] = layer.objects;
            }
        }
    }

    /**
     * Convert flat array to 2D grid
     */
    toGrid(flatArray, width) {
        const grid = [];
        for (let i = 0; i < flatArray.length; i += width) {
            grid.push(flatArray.slice(i, i + width));
        }
        return grid;
    }

    /**
     * Check if a tile position is solid (for collision)
     * @param {number} tileX - Tile X coordinate
     * @param {number} tileY - Tile Y coordinate
     * @returns {boolean} True if solid
     */
    isSolid(tileX, tileY) {
        // Out of bounds = solid
        if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
            return true;
        }

        const collision = this.layers.collision;
        if (!collision) return false;

        return collision[tileY][tileX] !== 0;
    }

    /**
     * Check if a world position collides with solid tiles
     * @param {number} x - World X position
     * @param {number} y - World Y position
     * @returns {boolean} True if position is in a solid tile
     */
    isSolidAtWorld(x, y) {
        const tile = this.worldToTile(x, y);
        return this.isSolid(tile.x, tile.y);
    }

    /**
     * Check if a bounding box collides with any solid tiles
     * @param {number} x - Left edge
     * @param {number} y - Top edge
     * @param {number} width - Box width
     * @param {number} height - Box height
     * @returns {boolean} True if any corner or edge touches solid
     */
    collidesWithBox(x, y, width, height) {
        // Check all four corners
        const left = Math.floor(x / this.tileWidth);
        const right = Math.floor((x + width - 1) / this.tileWidth);
        const top = Math.floor(y / this.tileHeight);
        const bottom = Math.floor((y + height - 1) / this.tileHeight);

        for (let ty = top; ty <= bottom; ty++) {
            for (let tx = left; tx <= right; tx++) {
                if (this.isSolid(tx, ty)) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Convert world coordinates to tile coordinates
     * @param {number} x - World X
     * @param {number} y - World Y
     * @returns {{x: number, y: number}} Tile coordinates
     */
    worldToTile(x, y) {
        return {
            x: Math.floor(x / this.tileWidth),
            y: Math.floor(y / this.tileHeight)
        };
    }

    /**
     * Convert tile coordinates to world coordinates (top-left of tile)
     * @param {number} tileX - Tile X
     * @param {number} tileY - Tile Y
     * @returns {{x: number, y: number}} World coordinates
     */
    tileToWorld(tileX, tileY) {
        return {
            x: tileX * this.tileWidth,
            y: tileY * this.tileHeight
        };
    }

    /**
     * Get spawn point for player
     * @returns {{x: number, y: number}|null} World coordinates or null if not found
     */
    getPlayerSpawn() {
        const spawns = this.objects.spawns;
        if (!spawns) return null;

        const playerSpawn = spawns.find(obj => obj.name === "player");
        if (playerSpawn) {
            return { x: playerSpawn.x, y: playerSpawn.y };
        }
        return null;
    }

    /**
     * Get all enemy spawn points
     * @returns {Array<{x: number, y: number, type: string}>} Array of spawn data
     */
    getEnemySpawns() {
        const spawns = this.objects.spawns;
        if (!spawns) return [];

        return spawns
            .filter(obj => obj.name === "enemy")
            .map(obj => {
                // Get enemyType from properties array if it exists
                let enemyType = "default";
                if (obj.properties) {
                    const typeProp = obj.properties.find(p => p.name === "enemyType");
                    if (typeProp) enemyType = typeProp.value;
                }
                return {
                    x: obj.x,
                    y: obj.y,
                    type: enemyType
                };
            });
    }

    /**
     * Draw the collision layer (for debugging)
     * @param {CanvasRenderingContext2D} ctx
     */
    drawDebug(ctx) {
        const collision = this.layers.collision;
        if (!collision) return;

        ctx.save();
        ctx.globalAlpha = 0.5;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (collision[y][x] !== 0) {
                    ctx.fillStyle = "#ff0000";
                    ctx.fillRect(
                        x * this.tileWidth,
                        y * this.tileHeight,
                        this.tileWidth,
                        this.tileHeight
                    );
                }
            }
        }

        // Draw grid lines
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = "#ffffff";
        for (let x = 0; x <= this.width; x++) {
            ctx.beginPath();
            ctx.moveTo(x * this.tileWidth, 0);
            ctx.lineTo(x * this.tileWidth, this.height * this.tileHeight);
            ctx.stroke();
        }
        for (let y = 0; y <= this.height; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * this.tileHeight);
            ctx.lineTo(this.width * this.tileWidth, y * this.tileHeight);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Draw a tile layer using the tileset
     * @param {CanvasRenderingContext2D} ctx
     * @param {string} layerName - Name of layer to draw
     * @param {number} [tilesPerRow=8] - Tiles per row in tileset image
     */
    drawLayer(ctx, layerName, tilesPerRow = 8) {
        const layer = this.layers[layerName];
        if (!layer || !this.tileset) return;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tileId = layer[y][x];
                if (tileId === 0) continue; // 0 = empty

                // Calculate source position in tileset (tileId - 1 because Tiled uses 1-indexed)
                const srcX = ((tileId - 1) % tilesPerRow) * this.tileWidth;
                const srcY = Math.floor((tileId - 1) / tilesPerRow) * this.tileHeight;

                ctx.drawImage(
                    this.tileset,
                    srcX, srcY, this.tileWidth, this.tileHeight,
                    x * this.tileWidth, y * this.tileHeight, this.tileWidth, this.tileHeight
                );
            }
        }
    }
}

export default TileMap;
