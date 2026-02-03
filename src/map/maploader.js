import TileMap from "./tilemap.js";

/**
 * MapLoader - Utility for loading Tiled JSON maps
 *
 * Usage:
 *   const loader = new MapLoader();
 *   loader.queueMap("assets/maps/level1.json");
 *   await loader.loadAll();
 *   const tileMap = loader.getMap("assets/maps/level1.json");
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
     * @param {HTMLImageElement} [tileset] - Optional tileset image to use for all maps
     * @returns {Promise} Resolves when all maps are loaded
     */
    async loadAll(tileset = null) {
        const promises = this.queue.map(async (path) => {
            try {
                const response = await fetch(path);
                if (!response.ok) {
                    throw new Error(`Failed to load map: ${path}`);
                }
                const data = await response.json();
                this.mapData[path] = data;
                this.maps[path] = new TileMap(data, tileset);
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
     * @param {HTMLImageElement} [tileset] - Optional tileset image
     * @returns {Promise<TileMap>} The loaded TileMap
     */
    async load(path, tileset = null) {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error(`Failed to load map: ${path}`);
        }
        const data = await response.json();
        this.mapData[path] = data;
        this.maps[path] = new TileMap(data, tileset);
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
}

export default MapLoader;
