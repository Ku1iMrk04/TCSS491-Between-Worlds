/**
 * TileMap - Parses and renders Tiled JSON map files
 *
 * Supports:
 * - Tile layers with base64 encoding
 * - Multiple tilesets (background + foreground)
 * - Object layers (spawn points, triggers)
 * - Per-tile polygon collision from Tiled's Tile Collision Editor
 */
class TileMap {
    /**
     * @param {Object} mapData - Parsed Tiled JSON data
     * @param {Object} tilesets - Object containing tileset images { background, foreground }
     */
    constructor(mapData, tilesets = {}) {
        this.width = mapData.width;           // Width in tiles
        this.height = mapData.height;         // Height in tiles
        this.tileWidth = mapData.tilewidth;   // Pixel width of each tile
        this.tileHeight = mapData.tileheight; // Pixel height of each tile

        // Store tileset images and their firstgid values
        this.tilesets = tilesets;
        this.tilesetInfo = this.parseTilesetInfo(mapData.tilesets || []);

        // Parse tile collision shapes from embedded tilesets
        this.tileCollisions = this.parseTileCollisions(mapData.tilesets || []);

        this.layers = {};
        this.objects = {};

        this.parseLayer(mapData.layers);

        // Debug: log unique foreground tile GIDs
        if (this.layers.Foreground) {
            const uniqueGids = new Set();
            for (const row of this.layers.Foreground) {
                for (const gid of row) {
                    if (gid !== 0) uniqueGids.add(gid);
                }
            }
            console.log("Unique foreground GIDs:", Array.from(uniqueGids).sort((a, b) => a - b));
            console.log("Tileset info:", this.tilesetInfo);
        }
    }

    /**
     * Parse tileset information from map data
     */
    parseTilesetInfo(tilesets) {
        const info = [];
        for (const ts of tilesets) {
            info.push({
                firstgid: ts.firstgid,
                image: ts.image || ts.source,
                columns: ts.columns || 27
            });
        }
        // Sort by firstgid descending for lookup
        info.sort((a, b) => b.firstgid - a.firstgid);
        return info;
    }

    /**
     * Parse tile collision shapes from embedded tilesets
     * Returns a map of localTileId -> collision polygons
     * Also stores tileset info for mapping external tilesets to collision data
     */
    parseTileCollisions(tilesets) {
        const collisions = {};
        this.collisionTilesetFirstGid = null;

        for (const ts of tilesets) {
            // Only embedded tilesets have tiles array with collision data
            if (!ts.tiles) continue;

            // Remember which tileset has the collision data
            this.collisionTilesetFirstGid = ts.firstgid;
            console.log(`Found embedded tileset with collision data at firstgid ${ts.firstgid}`);

            for (const tile of ts.tiles) {
                if (!tile.objectgroup || !tile.objectgroup.objects) continue;

                // Store by LOCAL tile ID so we can look up from any tileset using same image
                const localId = tile.id;
                const shapes = [];

                for (const obj of tile.objectgroup.objects) {
                    if (obj.polygon) {
                        // Polygon collision shape
                        const points = obj.polygon.map(p => ({
                            x: obj.x + p.x,
                            y: obj.y + p.y
                        }));
                        shapes.push({ type: 'polygon', points });
                    } else if (obj.width && obj.height) {
                        // Rectangle collision shape
                        shapes.push({
                            type: 'rect',
                            x: obj.x,
                            y: obj.y,
                            width: obj.width,
                            height: obj.height
                        });
                    }
                }

                if (shapes.length > 0) {
                    collisions[localId] = shapes;
                    console.log(`Stored collision for local tile ID ${localId}:`, shapes);
                }
            }
        }

        console.log("All collision IDs:", Object.keys(collisions));
        return collisions;
    }

    /**
     * Get collision shapes for a global tile ID
     * Converts to local ID to handle multiple tilesets with same image
     */
    getCollisionShapes(gid) {
        if (gid === 0) return null;

        // Find which tileset this gid belongs to and get local ID
        for (const info of this.tilesetInfo) {
            if (gid >= info.firstgid) {
                const localId = gid - info.firstgid;
                const shapes = this.tileCollisions[localId] || null;
                return shapes;
            }
        }
        return null;
    }

    /**
     * Parse all layers from Tiled data
     */
    parseLayer(layers) {
        for (const layer of layers) {
            if (layer.type === "tilelayer") {
                // Check if data is base64 encoded
                let tileData;
                if (typeof layer.data === "string") {
                    tileData = this.decodeBase64(layer.data);
                } else {
                    tileData = layer.data;
                }
                // Convert flat array to 2D grid
                this.layers[layer.name] = this.toGrid(tileData, this.width);
            } else if (layer.type === "objectgroup") {
                this.objects[layer.name] = layer.objects;
            }
        }
    }

    /**
     * Decode base64 encoded tile data
     * Tiled uses little-endian 32-bit integers
     */
    decodeBase64(base64String) {
        // Decode base64 to binary string
        const binaryString = atob(base64String);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // Convert to 32-bit integers (little-endian)
        const tileData = [];
        for (let i = 0; i < bytes.length; i += 4) {
            const tileId = bytes[i] |
                          (bytes[i + 1] << 8) |
                          (bytes[i + 2] << 16) |
                          (bytes[i + 3] << 24);
            // Mask out flip flags (top 3 bits) - we ignore flipping for now
            tileData.push(tileId & 0x1FFFFFFF);
        }
        return tileData;
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
     * Get collision shapes for a tile at given position
     * @returns {Array|null} Array of collision shapes or null if no custom collision
     */
    getTileCollision(tileX, tileY) {
        const foreground = this.layers.Foreground;
        if (!foreground) return null;

        if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
            return null;
        }

        const gid = foreground[tileY][tileX];
        if (gid === 0) return null;

        return this.getCollisionShapes(gid);
    }

    /**
     * Check if a tile has a slope collision
     * Returns slope info if it's a slope, null otherwise
     */
    getSlopeAt(tileX, tileY) {
        const shapes = this.getTileCollision(tileX, tileY);
        if (!shapes || shapes.length === 0) return null;

        // Check if the shape looks like a slope (polygon with angled top)
        for (const shape of shapes) {
            if (shape.type === 'polygon') {
                const points = shape.points;
                if (points.length >= 3) {
                    // Analyze the polygon to determine if it's a slope
                    // Check for common slope patterns by finding corner positions

                    const tolerance = 2; // Allow small deviation for corner detection
                    const hasBottomLeft = points.some(p => Math.abs(p.x) < tolerance && Math.abs(p.y - this.tileHeight) < tolerance);
                    const hasBottomRight = points.some(p => Math.abs(p.x - this.tileWidth) < tolerance && Math.abs(p.y - this.tileHeight) < tolerance);
                    const hasTopLeft = points.some(p => Math.abs(p.x) < tolerance && Math.abs(p.y) < tolerance);
                    const hasTopRight = points.some(p => Math.abs(p.x - this.tileWidth) < tolerance && Math.abs(p.y) < tolerance);

                    const tileWorldX = tileX * this.tileWidth;
                    const tileWorldY = tileY * this.tileHeight;

                    // Right-ascending slope (/) - bottom-left to top-right
                    if (hasBottomLeft && hasTopRight) {
                        return {
                            type: 'ascending',
                            x: tileWorldX,
                            y: tileWorldY,
                            getYForX: (worldX) => {
                                const localX = worldX - tileWorldX;
                                // Clamp to tile bounds
                                const clampedX = Math.max(0, Math.min(this.tileWidth, localX));
                                // Linear interpolation from bottom-left to top-right
                                const t = clampedX / this.tileWidth;
                                return tileWorldY + this.tileHeight - (t * this.tileHeight);
                            }
                        };
                    }

                    // Left-ascending slope (\) - bottom-right to top-left
                    if (hasBottomRight && hasTopLeft) {
                        return {
                            type: 'descending',
                            x: tileWorldX,
                            y: tileWorldY,
                            getYForX: (worldX) => {
                                const localX = worldX - tileWorldX;
                                // Clamp to tile bounds
                                const clampedX = Math.max(0, Math.min(this.tileWidth, localX));
                                // Linear interpolation from top-left to bottom-right
                                const t = clampedX / this.tileWidth;
                                return tileWorldY + (t * this.tileHeight);
                            }
                        };
                    }
                }
            }
        }
        return null;
    }

    /**
     * Get the Y position on a slope at a given X coordinate
     * Returns null if not on a slope
     */
    getSlopeYAtWorld(worldX, worldY) {
        const tileX = Math.floor(worldX / this.tileWidth);
        const tileY = Math.floor(worldY / this.tileHeight);

        const slope = this.getSlopeAt(tileX, tileY);
        if (!slope) return null;

        return slope.getYForX(worldX);
    }

    /**
     * Check if a tile has any collision (custom shapes or full tile)
     */
    isSolid(tileX, tileY) {
        // Out of bounds = solid
        if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
            return true;
        }

        const foreground = this.layers.Foreground;
        if (!foreground) return false;

        const gid = foreground[tileY][tileX];
        return gid !== 0;
    }

    /**
     * Check if a point is inside a polygon using ray casting
     */
    pointInPolygon(px, py, polygon) {
        let inside = false;
        const n = polygon.length;

        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;

            if (((yi > py) !== (yj > py)) &&
                (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }

        return inside;
    }

    /**
     * Check if a point collides with a tile's collision shape
     * @param {number} worldX - World X position
     * @param {number} worldY - World Y position
     * @returns {boolean} True if collision
     */
    isSolidAtWorld(worldX, worldY) {
        const tileX = Math.floor(worldX / this.tileWidth);
        const tileY = Math.floor(worldY / this.tileHeight);

        // Out of bounds = solid
        if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
            return true;
        }

        const foreground = this.layers.Foreground;
        if (!foreground) return false;

        const gid = foreground[tileY][tileX];
        if (gid === 0) return false;

        // Get custom collision shapes
        const shapes = this.getCollisionShapes(gid);
        if (!shapes) {
            // No custom shape = full tile collision
            return true;
        }

        // Convert world position to local tile position
        const localX = worldX - (tileX * this.tileWidth);
        const localY = worldY - (tileY * this.tileHeight);

        // Check each collision shape
        for (const shape of shapes) {
            if (shape.type === 'polygon') {
                if (this.pointInPolygon(localX, localY, shape.points)) {
                    return true;
                }
            } else if (shape.type === 'rect') {
                if (localX >= shape.x && localX < shape.x + shape.width &&
                    localY >= shape.y && localY < shape.y + shape.height) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if a bounding box collides with tiles using polygon collision
     */
    collidesWithBox(x, y, width, height) {
        // Get tile range to check
        const left = Math.floor(x / this.tileWidth);
        const right = Math.floor((x + width - 1) / this.tileWidth);
        const top = Math.floor(y / this.tileHeight);
        const bottom = Math.floor((y + height - 1) / this.tileHeight);

        for (let tileY = top; tileY <= bottom; tileY++) {
            for (let tileX = left; tileX <= right; tileX++) {
                if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
                    return true; // Out of bounds = collision
                }

                const foreground = this.layers.Foreground;
                if (!foreground) continue;

                const gid = foreground[tileY][tileX];
                if (gid === 0) continue;

                const shapes = this.getCollisionShapes(gid);
                if (!shapes) {
                    // No custom shape = full tile collision
                    return true;
                }

                // Check box against each collision shape
                const tileWorldX = tileX * this.tileWidth;
                const tileWorldY = tileY * this.tileHeight;

                for (const shape of shapes) {
                    if (shape.type === 'polygon') {
                        if (this.boxIntersectsPolygon(x, y, width, height, shape.points, tileWorldX, tileWorldY)) {
                            return true;
                        }
                    } else if (shape.type === 'rect') {
                        // Check box vs rect
                        const rectX = tileWorldX + shape.x;
                        const rectY = tileWorldY + shape.y;
                        if (x < rectX + shape.width && x + width > rectX &&
                            y < rectY + shape.height && y + height > rectY) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    /**
     * Check if a box intersects with a polygon
     * Uses a simplified check: tests box corners against polygon
     */
    boxIntersectsPolygon(boxX, boxY, boxW, boxH, polygon, offsetX, offsetY) {
        // Offset polygon points to world coordinates
        const worldPoly = polygon.map(p => ({
            x: p.x + offsetX,
            y: p.y + offsetY
        }));

        // Check if any box corner is inside polygon
        const corners = [
            { x: boxX, y: boxY },
            { x: boxX + boxW, y: boxY },
            { x: boxX, y: boxY + boxH },
            { x: boxX + boxW, y: boxY + boxH }
        ];

        for (const corner of corners) {
            if (this.pointInPolygon(corner.x, corner.y, worldPoly)) {
                return true;
            }
        }

        // Check if any polygon point is inside box
        for (const p of worldPoly) {
            if (p.x >= boxX && p.x <= boxX + boxW &&
                p.y >= boxY && p.y <= boxY + boxH) {
                return true;
            }
        }

        return false;
    }

    /**
     * Convert world coordinates to tile coordinates
     */
    worldToTile(x, y) {
        return {
            x: Math.floor(x / this.tileWidth),
            y: Math.floor(y / this.tileHeight)
        };
    }

    /**
     * Convert tile coordinates to world coordinates (top-left of tile)
     */
    tileToWorld(tileX, tileY) {
        return {
            x: tileX * this.tileWidth,
            y: tileY * this.tileHeight
        };
    }

    /**
     * Get spawn point for player (hardcoded for this map)
     */
    getPlayerSpawn() {
        return { x: 160, y: 256 };
    }

    /**
     * Get all enemy spawn points (hardcoded for this map)
     */
    getEnemySpawns() {
        return [
            { x: 2111, y: 480, type: "grunt" },
            { x: 840, y: 256, type: "scientist" },
            { x: 1000, y: 700, type: "gangster" }
        ];
    }

    /**
     * Draw the collision layer (for debugging)
     * Shows polygon shapes when available
     */
    drawDebug(ctx) {
        const foreground = this.layers.Foreground;
        if (!foreground) return;

        ctx.save();

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const gid = foreground[y][x];
                if (gid === 0) continue;

                const tileWorldX = x * this.tileWidth;
                const tileWorldY = y * this.tileHeight;
                const shapes = this.getCollisionShapes(gid);

                if (shapes) {
                    // Draw custom collision shapes
                    ctx.fillStyle = "rgba(0, 255, 0, 0.5)";
                    ctx.strokeStyle = "rgba(0, 255, 0, 0.8)";
                    ctx.lineWidth = 1;

                    for (const shape of shapes) {
                        if (shape.type === 'polygon') {
                            ctx.beginPath();
                            const first = shape.points[0];
                            ctx.moveTo(tileWorldX + first.x, tileWorldY + first.y);
                            for (let i = 1; i < shape.points.length; i++) {
                                ctx.lineTo(tileWorldX + shape.points[i].x, tileWorldY + shape.points[i].y);
                            }
                            ctx.closePath();
                            ctx.fill();
                            ctx.stroke();
                        } else if (shape.type === 'rect') {
                            ctx.fillRect(tileWorldX + shape.x, tileWorldY + shape.y, shape.width, shape.height);
                            ctx.strokeRect(tileWorldX + shape.x, tileWorldY + shape.y, shape.width, shape.height);
                        }
                    }
                } else {
                    // Full tile collision (red)
                    ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
                    ctx.fillRect(tileWorldX, tileWorldY, this.tileWidth, this.tileHeight);
                }
            }
        }

        // Draw grid lines
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = "#ffffff";
        for (let gx = 0; gx <= this.width; gx++) {
            ctx.beginPath();
            ctx.moveTo(gx * this.tileWidth, 0);
            ctx.lineTo(gx * this.tileWidth, this.height * this.tileHeight);
            ctx.stroke();
        }
        for (let gy = 0; gy <= this.height; gy++) {
            ctx.beginPath();
            ctx.moveTo(0, gy * this.tileHeight);
            ctx.lineTo(this.width * this.tileWidth, gy * this.tileHeight);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Get tileset image and local tile ID for a global tile ID
     */
    getTilesetForGid(gid) {
        if (gid === 0) return null;

        for (const info of this.tilesetInfo) {
            if (gid >= info.firstgid) {
                // Detect tileset type by checking the image source path
                const isForeground = info.image && info.image.toLowerCase().includes('foreground');
                const image = isForeground ? this.tilesets.foreground : this.tilesets.background;
                const tilesPerRow = isForeground ? 27 : 28;
                return {
                    image: image,
                    localId: gid - info.firstgid,
                    tilesPerRow: tilesPerRow
                };
            }
        }
        return null;
    }

    /**
     * Draw a tile layer using the appropriate tileset
     */
    drawLayer(ctx, layerName) {
        const layer = this.layers[layerName];
        if (!layer) return;

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const gid = layer[y][x];
                if (gid === 0) continue;

                const tileInfo = this.getTilesetForGid(gid);
                if (!tileInfo || !tileInfo.image) continue;

                const srcX = (tileInfo.localId % tileInfo.tilesPerRow) * this.tileWidth;
                const srcY = Math.floor(tileInfo.localId / tileInfo.tilesPerRow) * this.tileHeight;

                ctx.drawImage(
                    tileInfo.image,
                    srcX, srcY, this.tileWidth, this.tileHeight,
                    x * this.tileWidth, y * this.tileHeight, this.tileWidth, this.tileHeight
                );
            }
        }
    }

    drawBackground(ctx) {
        this.drawLayer(ctx, "Background");
    }

    drawForeground(ctx) {
        this.drawLayer(ctx, "Foreground");
    }
}

export default TileMap;
