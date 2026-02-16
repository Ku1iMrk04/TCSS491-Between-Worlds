import SpriteAtlas from "./src/animation/spriteatlas.js";

export class AssetManager {
    constructor() {
        this.successCount = 0;
        this.errorCount = 0;
        this.cache = [];
        this.downloadQueue = [];
        this.metadataPromises = [];
    };

    queueDownload(path) {
        console.log("Queueing " + path);
        this.downloadQueue.push(path);
    };

    /**
     * Queue a sprite .png and automatically load matching .json metadata
     * Example: queueSprite('./assets/player.png') also loads './assets/player.json'
     */
    queueSprite(imagePath) {
        this.queueDownload(imagePath);
        // './assets/player.png' -> './assets/player.json'
        const metadataPath = imagePath.replace('.png', '.json');

        const metadataPromise = fetch(metadataPath)
            .then(response => response.ok ? response.json() : null)
            .then(metadata => {
                if (metadata) {
                    this.cache[metadataPath] = metadata;
                    console.log("Loaded metadata for " + imagePath);
                }
            })
            .catch(() => console.warn("No metadata found for " + imagePath));

        this.metadataPromises.push(metadataPromise);
    };

    isDone() {
        return this.downloadQueue.length === this.successCount + this.errorCount;
    };

    downloadAll(callback) {
        // Wait for all metadata to load before calling callback
        Promise.all(this.metadataPromises).then(() => {
            if (this.downloadQueue.length === 0) setTimeout(callback, 10);
            for (let i = 0; i < this.downloadQueue.length; i++) {
                const img = new Image();

                const path = this.downloadQueue[i];

                img.addEventListener("load", () => {
                    console.log("Loaded " + img.src);
                    this.successCount++;
                    if (this.isDone()) callback();
                });

                img.addEventListener("error", () => {
                    console.log("Error loading " + img.src);
                    this.errorCount++;
                    if (this.isDone()) callback();
                });

                img.src = path;
                this.cache[path] = img;
            }
        });
    };

    getAsset(path) {
        return this.cache[path];
    };

    /**
     * Get metadata for a sprite image
     * @param {string} imagePath - Path to the image (e.g., './assets/player.png')
     * @returns {object|null} The metadata object or null if not found
     */
    getMetadata(imagePath) {
        const metadataPath = imagePath.replace('.png', '.json');
        return this.cache[metadataPath] || null;
    };

    /**
     * Get both image and metadata together as a sprite atlas
     * @param {string} imagePath - Path to the image
     * @returns {SpriteAtlas} SpriteAtlas instance
     */
    getSpriteAtlas(imagePath) {
        const metadata = this.getMetadata(imagePath);
        return new SpriteAtlas(
            this.getAsset(imagePath),
            metadata
        );
    };
}

