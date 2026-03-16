/**
 * SoundManager - centralized audio system for music and sound effects.
 *
 * All sounds are registered once in main.js, then played by name anywhere
 * via game.soundManager.
 *
 * Music API:
 *   soundManager.registerMusic("gameplay", "assets/sounds/backgroundMusic.mp3");
 *   soundManager.playMusic("gameplay");
 *   soundManager.stopMusic();
 *   soundManager.pauseMusic();
 *   soundManager.resumeMusic();
 *
 * SFX API:
 *   soundManager.registerSfx("jump", "assets/sounds/jump.wav", 0.4);
 *   soundManager.playSfx("jump");
 *
 * Volume (0–1 slider ratio, applied to both music and SFX):
 *   soundManager.setVolume(0.6);
 */
class SoundManager {
    constructor() {
        this.tracks = {};       // name -> HTMLAudioElement (looping music)
        this.sfx = {};          // name -> { audio: HTMLAudioElement, baseVolume: number }

        this.current = null;    // currently playing music element
        this.currentName = null;

        this.volume = 0.4;      // master slider ratio 0-1
        this.maxVolume = 0.5;   // music element volume is capped at this
        this.muted = false;
    }

    // -------------------------------------------------------------------------
    // Music
    // -------------------------------------------------------------------------

    /**
     * Register a looping background music track.
     * @param {string} name  - Key used in playMusic()
     * @param {string} path  - File path relative to index.html
     */
    registerMusic(name, path) {
        const audio = new Audio(path);
        audio.loop = true;
        audio.volume = this.volume * this.maxVolume;
        this.tracks[name] = audio;
    }

    /**
     * Start playing a named music track. No-ops if already playing that track.
     * Stops whatever was playing before.
     * @param {string} name
     */
    playMusic(name) {
        if (this.currentName === name && this.current && !this.current.paused) return;
        this.stopMusic();

        const audio = this.tracks[name];
        if (!audio) {
            console.warn(`SoundManager: music track "${name}" not registered`);
            return;
        }

        audio.currentTime = 0;
        audio.volume = this.muted ? 0 : this.volume * this.maxVolume;
        audio.play().catch(err => console.warn("Music play failed (autoplay policy?):", err));
        this.current = audio;
        this.currentName = name;
    }

    /** Stop the currently playing music track. */
    stopMusic() {
        if (this.current) {
            this.current.pause();
            this.current.currentTime = 0;
            this.current = null;
            this.currentName = null;
        }
    }

    /** Pause without resetting playback position. */
    pauseMusic() {
        if (this.current) {
            this.current.pause();
        }
    }

    /** Resume a paused track. */
    resumeMusic() {
        if (this.current) {
            this.current.play().catch(() => {});
        }
    }

    // -------------------------------------------------------------------------
    // SFX
    // -------------------------------------------------------------------------

    /**
     * Pre-load a sound effect so it can be played instantly by name.
     * @param {string} name        - Key used in playSfx()
     * @param {string} path        - File path relative to index.html
     * @param {number} baseVolume  - Volume before master ratio is applied (0-1)
     */
    registerSfx(name, path, baseVolume = 0.4) {
        const audio = new Audio(path);
        this.sfx[name] = { audio, baseVolume };
    }

    /**
     * Play a registered sound effect. Clones the element so overlapping calls
     * (e.g. rapid attacks) play simultaneously without cutting each other off.
     * @param {string} name
     */
    playSfx(name) {
        const entry = this.sfx[name];
        if (!entry) {
            console.warn(`SoundManager: sfx "${name}" not registered`);
            return;
        }
        const clone = entry.audio.cloneNode();
        clone.volume = Math.min(1, entry.baseVolume * this.volume * 2); // scale to master
        clone.play().catch(() => {});
    }

    // -------------------------------------------------------------------------
    // Shared
    // -------------------------------------------------------------------------

    /**
     * Set master volume (0 to 1). Affects currently playing music immediately.
     * SFX picks it up on the next playSfx() call.
     * @param {number} vol
     */
    setVolume(vol) {
        this.volume = Math.max(0, Math.min(1, vol));
        if (this.current && !this.muted) this.current.volume = this.volume * this.maxVolume;
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.current) {
            this.current.volume = this.muted ? 0 : this.volume * this.maxVolume;
        }
    }
}

export default SoundManager;
