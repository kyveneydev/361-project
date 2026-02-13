/**
 * Abstract interface for music generators
 * 
 * This interface defines the contract that all music generators must implement.
 * This allows easy swapping of different music generation implementations.
 */
class MusicGenerator {
    /**
     * Generate music based on a text description
     * 
     * @param {string} description - Text description of desired music
     * @param {Function} onProgress - Callback for progress updates (0-100)
     * @returns {Promise<AudioBuffer|string>} - Audio buffer or URL to audio file
     * @throws {Error} - If generation fails
     */
    async generate(description, onProgress) {
        throw new Error('generate() must be implemented by subclass');
    }
    
    /**
     * Get the name of this generator
     * @returns {string}
     */
    getName() {
        throw new Error('getName() must be implemented by subclass');
    }
    
    /**
     * Check if this generator is available/ready
     * @returns {Promise<boolean>}
     */
    async isAvailable() {
        throw new Error('isAvailable() must be implemented by subclass');
    }
    
    /**
     * Cleanup any resources used by this generator
     */
    cleanup() {
        // Optional cleanup - subclasses can override
    }
}
