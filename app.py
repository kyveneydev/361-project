from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import time
import threading
from music_service import MusicGenerationService

app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

# Initialize music generation service
music_service = MusicGenerationService()

# Store for active generation tasks
generation_tasks = {}

@app.route('/')
def index():
    """Serve the main HTML page"""
    return send_file('index.html')

@app.route('/styles.css')
def styles():
    """Serve CSS file"""
    return send_file('styles.css')

@app.route('/app.js')
def app_js():
    """Serve JavaScript file"""
    return send_file('app.js')

@app.route('/music-generator-interface.js')
def music_generator_interface():
    """Serve music generator interface"""
    return send_file('music-generator-interface.js')

@app.route('/tone-music-generator.js')
def tone_music_generator():
    """Serve Tone.js music generator"""
    return send_file('tone-music-generator.js')

@app.route('/api-music-generator.js')
def api_music_generator():
    """Serve API music generator"""
    return send_file('api-music-generator.js')

@app.route('/music-generator-manager.js')
def music_generator_manager():
    """Serve music generator manager"""
    return send_file('music-generator-manager.js')

@app.route('/api/generate-music', methods=['POST'])
def generate_music():
    """
    Generate music based on text description
    
    Expected JSON body:
    {
        "description": "upbeat jazz with piano and drums"
    }
    
    Returns:
    {
        "audio_url": "/api/audio/<task_id>",
        "task_id": "<task_id>"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        description = data.get('description', '').strip()
        
        # Validate description
        if not description:
            return jsonify({'error': 'Description is required'}), 400
        
        if len(description) < 10:
            return jsonify({
                'error': f'Description must be at least 10 characters (got {len(description)})'
            }), 400
        
        if len(description) > 2000:
            return jsonify({
                'error': 'Description is too long (maximum 2000 characters)'
            }), 400
        
        # Generate music (this will be async in a real implementation)
        # For now, we'll simulate generation
        task_id = music_service.start_generation(description)
        
        # Wait for generation to complete (in production, this would be async)
        # For demo purposes, we'll wait up to 30 seconds
        max_wait = 30
        wait_interval = 0.5
        waited = 0
        
        while waited < max_wait:
            status = music_service.get_status(task_id)
            if status['status'] == 'completed':
                return jsonify({
                    'audio_url': f'/api/audio/{task_id}',
                    'task_id': task_id
                })
            elif status['status'] == 'error':
                return jsonify({
                    'error': status.get('error', 'Music generation failed')
                }), 500
            
            time.sleep(wait_interval)
            waited += wait_interval
        
        # Timeout
        return jsonify({
            'error': 'Music generation timed out. Please try again.'
        }), 504
        
    except Exception as e:
        app.logger.error(f'Error generating music: {str(e)}')
        return jsonify({
            'error': 'An unexpected error occurred. Please try again.'
        }), 500

@app.route('/api/audio/<task_id>')
def get_audio(task_id):
    """
    Serve the generated audio file
    
    Args:
        task_id: The task ID returned from generate_music endpoint
    """
    try:
        audio_path = music_service.get_audio_path(task_id)
        
        if not audio_path or not os.path.exists(audio_path):
            return jsonify({'error': 'Audio file not found'}), 404
        
        return send_file(
            audio_path,
            mimetype='audio/mpeg',
            as_attachment=False
        )
        
    except Exception as e:
        app.logger.error(f'Error serving audio: {str(e)}')
        return jsonify({'error': 'Error serving audio file'}), 500

@app.route('/api/status/<task_id>')
def get_status(task_id):
    """
    Get the status of a music generation task
    
    Returns:
    {
        "status": "pending|processing|completed|error",
        "progress": 0-100,
        "error": "error message if status is error"
    }
    """
    try:
        status = music_service.get_status(task_id)
        return jsonify(status)
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Create necessary directories
    os.makedirs('generated_audio', exist_ok=True)
    
    # Run Flask app
    app.run(debug=True, host='0.0.0.0', port=5001)
