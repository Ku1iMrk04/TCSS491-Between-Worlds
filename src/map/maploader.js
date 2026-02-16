import TileMap from "./tilemap.js";

/**
 * MapLoader - Utility for loading Tiled JSON maps with multiple tilesets
 *
 * Usage:
 *   const loader = new MapLoader();
 *   const tilesets = {
 *       background: backgroundImage,
 *       foreground: foregroundImage
 *   };
 *   const tileMap = await loader.load("assets/maps/level1.json", tilesets);
 */
class MapLoader {
    constructor() {
        this.maps = {};        // Parsed TileMap instances
        this.mapData = {};     // Raw JSON data
        this.queue = [];       // Paths queued for loading
    }

    /**
     * Queue a map for loading
     * @param {string} path - Path to Tiled JSON file
     */
    queueMap(path) {
        if (!this.queue.includes(path)) {
            this.queue.push(path);
        }
    }

    /**
     * Load all queued maps
     * @param {Object} tilesets - Object containing tileset images { background, foreground }
     * @returns {Promise} Resolves when all maps are loaded
     */
    async loadAll(tilesets = {}) {
        const promises = this.queue.map(async (path) => {
            try {
                const response = await fetch(path);
                if (!response.ok) {
                    throw new Error(`Failed to load map: ${path}`);
                }
                const data = await response.json();

                // Load external tilesets before creating TileMap
                await this.loadExternalTilesets(data, path);

                this.mapData[path] = data;
                this.maps[path] = new TileMap(data, tilesets);
                console.log(`Loaded map: ${path}`);
            } catch (err) {
                console.error(`Error loading map ${path}:`, err);
            }
        });

        await Promise.all(promises);
        this.queue = [];
    }

    /**
     * Load a single map immediately
     * @param {string} path - Path to Tiled JSON file
     * @param {Object} tilesets - Object containing tileset images { background, foreground }
     * @returns {Promise<TileMap>} The loaded TileMap
     */
    async load(path, tilesets = {}) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load map: ${path}`);
        }
        const data = await response.json();

        // Load external tilesets before creating TileMap
        await this.loadExternalTilesets(data, path);

        this.mapData[path] = data;
        this.maps[path] = new TileMap(data, tilesets);
        console.log(`Loaded map: ${path}`);
        return this.maps[path];
    }

    /**
     * Get a loaded TileMap
     * @param {string} path - Path used when loading
     * @returns {TileMap|null}
     */
    getMap(path) {
        return this.maps[path] || null;
    }

    /**
     * Get raw map data
     * @param {string} path - Path used when loading
     * @returns {Object|null}
     */
    getMapData(path) {
        return this.mapData[path] || null;
    }

    /**
     * Load external tileset files and merge them into map data
     * @param {Object} mapData - The map JSON data
     * @param {string} mapPath - Path to the map file (for resolving relative paths)
     */
    async loadExternalTilesets(mapData, mapPath) {
        if (!mapData.tilesets) return;

        const basePath = mapPath.substring(0, mapPath.lastIndexOf('/') + 1);

        for (let i = 0; i < mapData.tilesets.length; i++) {
            const tileset = mapData.tilesets[i];

            // Check if this tileset references an external file
            if (tileset.source) {
                let tilesetPath = basePath + tileset.source;

                try {
                    // Try loading the file as-is first
                    let response = await fetch(tilesetPath);

                    // If .tsx not found, try .json instead
                    if (!response.ok && tilesetPath.endsWith('.tsx')) {
                        const jsonPath = tilesetPath.replace('.tsx', '.json');
                        console.log(`TSX file not found, trying JSON: ${jsonPath}`);
                        response = await fetch(jsonPath);
                        if (response.ok) {
                            tilesetPath = jsonPath;
                        }
                    }

                    if (!response.ok) {
                        console.warn(`Failed to load external tileset: ${tilesetPath}`);
                        continue;
                    }

                    const contentType = response.headers.get('content-type');
                    let tilesetData;

                    // Parse based on file extension or content type
                    if (tilesetPath.endsWith('.json') || contentType?.includes('json')) {
                        tilesetData = await response.json();
                    } else if (tilesetPath.endsWith('.tsx') || contentType?.includes('xml')) {
                        // Parse TSX (XML) file
                        const xmlText = await response.text();
                        tilesetData = this.parseTSX(xmlText);
                    } else {
                        console.warn(`Unknown tileset format: ${tilesetPath}`);
                        continue;
                    }

                    // Merge the external tileset data into the map's tileset entry
                    // Keep the firstgid from the map, but add all other properties from the external file
                    mapData.tilesets[i] = {
                        firstgid: tileset.firstgid,
                        ...tilesetData
                    };

                    console.log(`Loaded external tileset: ${tilesetPath}`);
                } catch (err) {
                    console.error(`Error loading external tileset ${tilesetPath}:`, err);
                }
            }
        }
    }

    /**
     * Parse TSX (XML) tileset format and convert to JSON structure
     * @param {string} xmlText - The TSX file content
     * @returns {Object} Tileset data in JSON format
     */
    parseTSX(xmlText) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const tilesetNode = xmlDoc.querySelector('tileset');

        const tileset = {
            name: tilesetNode.getAttribute('name'),
            tilewidth: parseInt(tilesetNode.getAttribute('tilewidth')),
            tileheight: parseInt(tilesetNode.getAttribute('tileheight')),
            tilecount: parseInt(tilesetNode.getAttribute('tilecount')),
            columns: parseInt(tilesetNode.getAttribute('columns')),
            margin: 0,
            spacing: 0
        };

        // Parse image
        const imageNode = tilesetNode.querySelector('image');
        if (imageNode) {
            tileset.image = imageNode.getAttribute('source');
            tileset.imagewidth = parseInt(imageNode.getAttribute('width'));
            tileset.imageheight = parseInt(imageNode.getAttribute('height'));
        }

        // Parse tiles with collision shapes
        const tileNodes = tilesetNode.querySelectorAll('tile');
        if (tileNodes.length > 0) {
            tileset.tiles = [];

            tileNodes.forEach(tileNode => {
                const tileId = parseInt(tileNode.getAttribute('id'));
                const objectgroupNode = tileNode.querySelector('objectgroup');

                if (objectgroupNode) {
                    const tile = {
                        id: tileId,
                        objectgroup: {
                            draworder: objectgroupNode.getAttribute('draworder') || 'index',
                            objects: []
                        }
                    };

                    const objectNodes = objectgroupNode.querySelectorAll('object');
                    objectNodes.forEach(objNode => {
                        const obj = {
                            id: parseInt(objNode.getAttribute('id') || '0'),
                            x: parseFloat(objNode.getAttribute('x') || '0'),
                            y: parseFloat(objNode.getAttribute('y') || '0'),
                            width: parseFloat(objNode.getAttribute('width') || '0'),
                            height: parseFloat(objNode.getAttribute('height') || '0'),
                            rotation: parseFloat(objNode.getAttribute('rotation') || '0'),
                            name: objNode.getAttribute('name') || '',
                            type: objNode.getAttribute('type') || '',
                            visible: true
                        };

                        // Parse polygon
                        const polygonNode = objNode.querySelector('polygon');
                        if (polygonNode) {
                            const points = polygonNode.getAttribute('points').split(' ').map(point => {
                                const [x, y] = point.split(',').map(parseFloat);
                                return { x, y };
                            });
                            obj.polygon = points;
                        }

                        // Parse polyline
                        const polylineNode = objNode.querySelector('polyline');
                        if (polylineNode) {
                            const points = polylineNode.getAttribute('points').split(' ').map(point => {
                                const [x, y] = point.split(',').map(parseFloat);
                                return { x, y };
                            });
                            obj.polyline = points;
                        }

                        tile.objectgroup.objects.push(obj);
                    });

                    tileset.tiles.push(tile);
                }
            });
        }

        return tileset;
    }
}

export default MapLoader;
