/**
 * Music Generator Manager
 * 
 * Manages music generator instances and provides easy switching between implementations.
 * This is the main entry point for music generation - change the generator here
 * to switch between different implementations.
 */
class MusicGeneratorManager {
    constructor() {
        this.generators = [];
        this.currentGenerator = null;
        this.fallbackGenerator = null;
    }
    
    /**
     * Register a music generator
     * @param {MusicGenerator} generator - Generator instance
     * @param {boolean} isDefault - Whether this should be the default generator
     */
    registerGenerator(generator, isDefault = false) {
        this.generators.push(generator);
        
        if (isDefault || !this.currentGenerator) {
            this.currentGenerator = generator;
        }
        
        if (!this.fallbackGenerator) {
            this.fallbackGenerator = generator;
        }
    }
    
    /**
     * Set the current generator by name
     * @param {string} name - Name of the generator
     */
    setGenerator(name) {
        const generator = this.generators.find(g => g.getName() === name);
        if (generator) {
            this.currentGenerator = generator;
            return true;
        }
        return false;
    }
    
    /**
     * Get the current generator
     * @returns {MusicGenerator}
     */
    getCurrentGenerator() {
        return this.currentGenerator || this.fallbackGenerator;
    }
    
    /**
     * Get all available generators
     * @returns {MusicGenerator[]}
     */
    getAvailableGenerators() {
        return this.generators.filter(async g => await g.isAvailable());
    }
    
    /**
     * Generate music using the current generator
     * Falls back to other generators if the current one fails
     * 
     * @param {string} description - Text description
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<AudioBuffer|string>}
     */
    async generate(description, onProgress) {
        const generatorsToTry = [
            this.currentGenerator,
            ...this.generators.filter(g => g !== this.currentGenerator)
        ].filter(g => g !== null);
        
        let lastError = null;
        
        for (const generator of generatorsToTry) {
            try {
                if (await generator.isAvailable()) {
                    return await generator.generate(description, onProgress);
                }
            } catch (error) {
                console.warn(`Generator ${generator.getName()} failed:`, error);
                lastError = error;
                continue;
            }
        }
        
        throw lastError || new Error('No available music generators');
    }
    
    /**
     * Initialize generators
     * This sets up the default generators (Tone.js first, API as fallback)
     */
    initialize() {
        // Register Tone.js generator (client-side, preferred)
        const toneGenerator = new ToneMusicGenerator();
        this.registerGenerator(toneGenerator, true);
        
        // Register API generator (server-side, fallback)
        const apiGenerator = new ApiMusicGenerator();
        this.registerGenerator(apiGenerator, false);
        
        console.log('Music generators initialized:', {
            current: this.currentGenerator?.getName(),
            available: this.generators.map(g => g.getName())
        });
    }
}

// Create global instance
const musicGeneratorManager = new MusicGeneratorManager();
