# Music Generator Web Application

A web application that generates music based on text descriptions. Users can input descriptions of
desired music, receive generated audio output, and play back their creations directly in the
browser.

## Features

### User Story 1: Text Input for Music Description

As a user, I want to receive generated audio based on my description so that I can hear the music I
requested.

- Text input field with clear placeholder text and labels
- Real-time validation (minimum 10 characters)
- Accessible design with ARIA labels and keyboard navigation
- WCAG AA compliant color contrast (4.5:1 ratio minimum)
- Clear error messages for invalid input

### User Story 2: Music Generation

As a user, I want to receive generated audio based on my description so that I can hear the music I
requested.

- Generates audio files (WAV format) based on text descriptions
- Displays loading status during generation
- Error handling with user-friendly messages
- Generation completes within 30 seconds for standard requests

### User Story 3: Audio Playback

As a user, I want to play the generated music directly in the web app so that I can listen to my
creation immediately without downloading.

- Built-in audio player with play/pause controls
- Volume control with slider
- Keyboard accessible (spacebar for play/pause, arrow keys for volume)
- Visible focus indicators for accessibility
- Text labels alongside icons

## Installation

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

## Running the Application

1. Start the Flask server:

```bash
python app.py
```

2. Open your web browser and navigate to:

```
http://localhost:5000
```

## API Endpoints

### POST `/api/generate-music`

Generate music based on a text description.

### GET `/api/audio/<task_id>`

Retrieve the generated audio file.

### GET `/api/status/<task_id>`

Get the status of a music generation task.

## Heuristics

### Accessibility Features

- ARIA labels and roles for screen readers
- Keyboard navigation support
- High contrast mode support
- Focus indicators
- Semantic HTML structure

### Performance

- Audio generation completes within 30 seconds
- Audio playback begins within 2 seconds
- Optimized for files under 5MB

### Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires JavaScript enabled
- HTML5 audio support required

### Current Implementations

1. Tone.js Generator
   - Generates music directly in the browser using Tone.js Web Audio API

2. API Generator
   - Uses the Flask backend API for music generation

### Switching Generators

To switch between generators, edit `music-generator-manager.js`:

## Notes

- **Tone.js** is loaded from CDN (no npm install needed)
- Generated audio files are stored in the `generated_audio/` directory (API generator only)
- Old audio files can be cleaned up using the `cleanup_old_tasks()` method
