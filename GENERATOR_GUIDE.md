# Music Generator Abstraction Layer Guide

## Overview

The music generator uses an abstraction layer pattern that allows easy swapping of different music generation implementations without changing the main application code.

## Architecture

```
app.js (Main Application)
    ↓
music-generator-manager.js (Manages generators)
    ↓
music-generator-interface.js (Abstract base class)
    ↓
├── tone-music-generator.js (Tone.js implementation)
└── api-music-generator.js (API implementation)
```

## How It Works

1. **MusicGenerator Interface**: Defines the contract all generators must follow
2. **Concrete Implementations**: Each generator extends `MusicGenerator` and implements:
   - `generate(description, onProgress)` - Generate music
   - `getName()` - Return generator name
   - `isAvailable()` - Check if generator is ready
   - `cleanup()` - Optional cleanup

3. **Manager**: Handles registration, selection, and fallback logic

## Current Generators

### Tone.js Generator (Default)
- **Location**: `tone-music-generator.js`
- **Type**: Client-side, browser-based
- **Pros**: Fast, no server needed, works offline
- **Cons**: Limited to browser capabilities

### API Generator (Fallback)
- **Location**: `api-music-generator.js`
- **Type**: Server-side via Flask API
- **Pros**: Can use powerful server-side models
- **Cons**: Requires server, network latency

## Switching Generators

### Method 1: Change Default in Manager

Edit `music-generator-manager.js`:

```javascript
initialize() {
    const toneGenerator = new ToneMusicGenerator();
    const apiGenerator = new ApiMusicGenerator();
    
    // Change order to change default
    this.registerGenerator(apiGenerator, true);  // Now API is default
    this.registerGenerator(toneGenerator, false);
}
```

### Method 2: Programmatic Switch

```javascript
// In app.js or console
musicGeneratorManager.setGenerator('API Generator');
```

## Adding a New Generator

### Step 1: Create Generator Class

Create `my-custom-generator.js`:

```javascript
class MyCustomGenerator extends MusicGenerator {
    getName() {
        return 'My Custom Generator';
    }
    
    async isAvailable() {
        // Check if your generator is ready
        return true;
    }
    
    async generate(description, onProgress) {
        // Your generation logic here
        if (onProgress) onProgress(10);
        
        // ... generate music ...
        
        if (onProgress) onProgress(100);
        
        // Return AudioBuffer or URL string
        return audioBuffer; // or "http://example.com/audio.mp3"
    }
    
    cleanup() {
        // Optional: cleanup resources
    }
}
```

### Step 2: Include in HTML

Add to `index.html` before `app.js`:

```html
<script src="my-custom-generator.js"></script>
```

### Step 3: Register in Manager

Edit `music-generator-manager.js`:

```javascript
initialize() {
    // ... existing generators ...
    
    const myGenerator = new MyCustomGenerator();
    this.registerGenerator(myGenerator, false);
}
```

### Step 4: Add Route (if needed)

If your generator needs server endpoints, add to `app.py`:

```python
@app.route('/my-generator-endpoint')
def my_endpoint():
    # Your endpoint logic
    pass
```

## Example: Adding fal.ai API Generator

```javascript
class FalAiGenerator extends MusicGenerator {
    constructor(apiKey) {
        super();
        this.apiKey = apiKey;
        this.apiUrl = 'https://fal.ai/models/cassetteai/music-generator';
    }
    
    getName() {
        return 'fal.ai Generator';
    }
    
    async isAvailable() {
        return !!this.apiKey;
    }
    
    async generate(description, onProgress) {
        if (onProgress) onProgress(10);
        
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prompt: description })
        });
        
        if (onProgress) onProgress(50);
        
        const data = await response.json();
        
        if (onProgress) onProgress(100);
        
        return data.audio_url; // Return URL string
    }
}
```

Then register:

```javascript
const falGenerator = new FalAiGenerator(process.env.FAL_API_KEY);
musicGeneratorManager.registerGenerator(falGenerator, true); // Set as default
```

## Best Practices

1. **Always implement `isAvailable()`**: Check dependencies before attempting generation
2. **Use progress callbacks**: Call `onProgress(0-100)` to update UI
3. **Handle errors gracefully**: Throw descriptive errors that can be shown to users
4. **Return consistent types**: Either `AudioBuffer` or URL string (not both)
5. **Cleanup resources**: Implement `cleanup()` if your generator uses resources that need disposal

## Testing Generators

Test individual generators:

```javascript
const generator = new ToneMusicGenerator();
const isReady = await generator.isAvailable();
console.log('Generator available:', isReady);

try {
    const result = await generator.generate(
        'upbeat jazz with piano',
        (progress) => console.log('Progress:', progress)
    );
    console.log('Generated:', result);
} catch (error) {
    console.error('Generation failed:', error);
}
```

## Troubleshooting

**Generator not working?**
- Check browser console for errors
- Verify `isAvailable()` returns `true`
- Check that generator is registered in manager

**Fallback not working?**
- Ensure multiple generators are registered
- Check that fallback generator's `isAvailable()` returns `true`

**Audio not playing?**
- Verify return type matches expected format (AudioBuffer or URL)
- Check that `loadAudio()` or `loadAudioFromBuffer()` handles your return type
