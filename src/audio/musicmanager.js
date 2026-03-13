/**
 * MusicManager - handles background music tracks.
 *
 * Usage:
 *   // Register tracks once in main.js
 *   game.musicManager.register("gameplay", "assets/audio/gameplay.mp3");
 *   game.musicManager.register("menu",     "assets/audio/menu.mp3");
 *
 *   // Play / stop from any scene
 *   game.musicManager.play("gameplay");
 *   game.musicManager.stop();
 *   game.musicManager.setVolume(0.4);
 */
class MusicManager {
    constructor() {
        this.tracks = {};       // name -> HTMLAudioElement
        this.current = null;    // currently playing element
        this.currentName = null;
        this.volume = 0.4;      // slider ratio 0-1
        this.maxVolume = 0.5;  // audio element never exceeds this
    }

    /**
     * Register a named track. Call this once during setup in main.js.
     * @param {string} name  - Friendly key, e.g. "gameplay", "menu"
     * @param {string} path  - File path relative to index.html
     */
    register(name, path) {
        const audio = new Audio(path);
        audio.loop = true;
        audio.volume = this.volume * this.maxVolume;
        this.tracks[name] = audio;
    }

    /**
     * Start playing a named track. No-ops if the track is already playing.
     * Stops whatever was playing before.
     * @param {string} name
     */
    play(name) {
        if (this.currentName === name) return;
        this.stop();

        const audio = this.tracks[name];
        if (!audio) {
            console.warn(`MusicManager: track "${name}" not registered`);
            return;
        }

        audio.currentTime = 0;
        audio.volume = this.volume * this.maxVolume;
        audio.play().catch(err => console.warn("Music play failed (autoplay policy?):", err));
        this.current = audio;
        this.currentName = name;
    }

    /**
     * Stop the currently playing track.
     */
    stop() {
        if (this.current) {
            this.current.pause();
            this.current.currentTime = 0;
            this.current = null;
            this.currentName = null;
        }
    }

    /**
     * Pause without resetting playback position.
     */
    pause() {
        if (this.current) {
            this.current.pause();
        }
    }

    /**
     * Resume a paused track.
     */
    resume() {
        if (this.current) {
            this.current.play().catch(() => {});
        }
    }

    /**
     * Set master volume (0 to 1).
     * @param {number} vol
     */
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.current) this.current.volume = this.volume * this.maxVolume;
    }
}

export default MusicManager;
