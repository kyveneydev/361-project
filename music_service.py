import os
import time
import uuid
import threading
from datetime import datetime

class MusicGenerationService:
    """
    Service for generating music based on text descriptions.
    
    This is a mock implementation that simulates music generation.
    In a real application, this would interface with an actual music
    generation API or model.
    """
    
    def __init__(self):
        self.tasks = {}
        self.audio_dir = 'generated_audio'
        os.makedirs(self.audio_dir, exist_ok=True)
    
    def start_generation(self, description):
        """
        Start music generation for a given description.
        
        Args:
            description: Text description of desired music
            
        Returns:
            task_id: Unique identifier for this generation task
        """
        task_id = str(uuid.uuid4())
        
        # Initialize task status
        self.tasks[task_id] = {
            'status': 'pending',
            'description': description,
            'progress': 0,
            'created_at': datetime.now(),
            'audio_path': None,
            'error': None
        }
        
        # Start generation in background thread
        thread = threading.Thread(
            target=self._generate_music,
            args=(task_id, description)
        )
        thread.daemon = True
        thread.start()
        
        return task_id
    
    def _generate_music(self, task_id, description):
        """
        Internal method to generate music.
        This simulates the generation process.
        """
        try:
            # Update status to processing
            self.tasks[task_id]['status'] = 'processing'
            self.tasks[task_id]['progress'] = 10
            
            # Simulate processing time (2-8 seconds based on description length)
            # In production, this would call an actual music generation API
            processing_time = min(8, max(2, len(description) / 50))
            
            steps = int(processing_time * 2)  # Update progress every 0.5 seconds
            step_time = processing_time / steps
            
            for i in range(steps):
                time.sleep(step_time)
                progress = 10 + int((i + 1) / steps * 80)
                self.tasks[task_id]['progress'] = progress
            
            # Generate audio file (mock - creates a simple audio file)
            audio_path = self._create_mock_audio(task_id, description)
            
            # Update task with completion
            self.tasks[task_id]['status'] = 'completed'
            self.tasks[task_id]['progress'] = 100
            self.tasks[task_id]['audio_path'] = audio_path
            
        except Exception as e:
            self.tasks[task_id]['status'] = 'error'
            self.tasks[task_id]['error'] = str(e)
    
    def _create_mock_audio(self, task_id, description):
        """
        Create a mock audio file for demonstration.
        In production, this would generate actual music.
        
        For now, we'll create a simple WAV file with a tone.
        """
        import wave
        import struct
        import math
        
        # Audio parameters
        sample_rate = 44100
        duration = 5.0  # 5 seconds
        frequency = 440.0  # A4 note
        
        # Adjust frequency based on description keywords
        description_lower = description.lower()
        if 'low' in description_lower or 'bass' in description_lower:
            frequency = 220.0  # A3
        elif 'high' in description_lower or 'treble' in description_lower:
            frequency = 880.0  # A5
        
        # Generate audio data
        num_samples = int(sample_rate * duration)
        audio_data = []
        
        for i in range(num_samples):
            # Create a simple sine wave with some variation
            t = float(i) / sample_rate
            # Add some harmonics for richer sound
            value = (
                math.sin(2 * math.pi * frequency * t) * 0.3 +
                math.sin(2 * math.pi * frequency * 2 * t) * 0.2 +
                math.sin(2 * math.pi * frequency * 3 * t) * 0.1
            )
            # Apply envelope (fade in/out)
            envelope = 1.0
            if t < 0.1:
                envelope = t / 0.1  # Fade in
            elif t > duration - 0.1:
                envelope = (duration - t) / 0.1  # Fade out
            
            value *= envelope
            # Convert to 16-bit integer
            audio_data.append(int(value * 32767))
        
        # Save as WAV file
        audio_path = os.path.join(self.audio_dir, f'{task_id}.wav')
        
        with wave.open(audio_path, 'w') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)
            
            for sample in audio_data:
                wav_file.writeframes(struct.pack('<h', sample))
        
        return audio_path
    
    def get_status(self, task_id):
        """
        Get the status of a generation task.
        
        Args:
            task_id: The task ID to check
            
        Returns:
            dict: Status information
        """
        if task_id not in self.tasks:
            return {
                'status': 'error',
                'error': 'Task not found'
            }
        
        return {
            'status': self.tasks[task_id]['status'],
            'progress': self.tasks[task_id]['progress'],
            'error': self.tasks[task_id].get('error')
        }
    
    def get_audio_path(self, task_id):
        """
        Get the path to the generated audio file.
        
        Args:
            task_id: The task ID
            
        Returns:
            str: Path to audio file, or None if not ready/not found
        """
        if task_id not in self.tasks:
            return None
        
        task = self.tasks[task_id]
        
        if task['status'] != 'completed':
            return None
        
        audio_path = task.get('audio_path')
        
        if audio_path and os.path.exists(audio_path):
            return audio_path
        
        return None
    
    def cleanup_old_tasks(self, max_age_hours=24):
        """
        Clean up old tasks and their audio files.
        
        Args:
            max_age_hours: Maximum age in hours before cleanup
        """
        current_time = datetime.now()
        
        tasks_to_remove = []
        for task_id, task in self.tasks.items():
            age = (current_time - task['created_at']).total_seconds() / 3600
            if age > max_age_hours:
                tasks_to_remove.append(task_id)
                # Delete audio file if it exists
                audio_path = task.get('audio_path')
                if audio_path and os.path.exists(audio_path):
                    try:
                        os.remove(audio_path)
                    except Exception:
                        pass
        
        for task_id in tasks_to_remove:
            del self.tasks[task_id]
