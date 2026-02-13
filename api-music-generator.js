/**
 * API-based music generator implementation
 * 
 * Generates music by calling the backend API.
 * This wraps the existing server-side generation.
 */
class ApiMusicGenerator extends MusicGenerator {
    constructor(apiEndpoint = '/api/generate-music') {
        super();
        this.apiEndpoint = apiEndpoint;
    }
    
    getName() {
        return 'API Generator';
    }
    
    async isAvailable() {
        // API is always available (will fail gracefully if server is down)
        return true;
    }
    
    async generate(description, onProgress) {
        try {
            if (onProgress) onProgress(10);
            
            // Call the API
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ description: description }),
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Server error: ${response.status}`);
            }
            
            if (onProgress) onProgress(50);
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            if (onProgress) onProgress(90);
            
            // Return the audio URL
            if (data.audio_url) {
                if (onProgress) onProgress(100);
                return data.audio_url;
            } else {
                throw new Error('No audio URL received from server');
            }
            
        } catch (error) {
            throw new Error(`API generation failed: ${error.message}`);
        }
    }
}
