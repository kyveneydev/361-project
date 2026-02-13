// DOM elements
const musicForm = document.getElementById('musicForm');
const musicDescription = document.getElementById('musicDescription');
const generateButton = document.getElementById('generateButton');
const errorMessage = document.getElementById('error-message');
const statusMessage = document.getElementById('statusMessage');
const statusSection = document.getElementById('statusSection');
const audioSection = document.getElementById('audioSection');
const audioPlayer = document.getElementById('audioPlayer');
const audioElement = document.getElementById('audioElement');
const playPauseButton = document.getElementById('playPauseButton');
const volumeButton = document.getElementById('volumeButton');
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');

// State
let isPlaying = false;
let currentAudioUrl = null;
let savedVolume = 100;
let isMuted = false;

// Constants
const MIN_DESCRIPTION_LENGTH = 10;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize music generator manager
    musicGeneratorManager.initialize();
    
    setupEventListeners();
    setupKeyboardNavigation();
});

// Event listeners
function setupEventListeners() {
    // Form submission
    musicForm.addEventListener('submit', handleFormSubmit);
    
    // Real-time validation
    musicDescription.addEventListener('input', handleInputValidation);
    musicDescription.addEventListener('blur', handleInputValidation);
    
    // Audio controls
    playPauseButton.addEventListener('click', togglePlayPause);
    volumeSlider.addEventListener('input', handleVolumeChange);
    volumeButton.addEventListener('click', toggleMute);
    
    // Audio element events
    audioElement.addEventListener('play', () => {
        isPlaying = true;
        updatePlayPauseButton();
    });
    
    audioElement.addEventListener('pause', () => {
        isPlaying = false;
        updatePlayPauseButton();
    });
    
    audioElement.addEventListener('loadeddata', () => {
        // Audio is ready to play
        showStatus('Music generated successfully! Click play to listen.', 'success');
    });
    
    audioElement.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        showStatus('Error playing audio. Please try generating again.', 'error');
    });
    
    audioElement.addEventListener('timeupdate', () => {
        // Could add progress bar here if needed
    });
}

// Keyboard navigation
function setupKeyboardNavigation() {
    // Spacebar for play/pause when audio player is visible
    document.addEventListener('keydown', (e) => {
        if (audioPlayer.style.display !== 'none' && e.target.tagName !== 'INPUT') {
            if (e.code === 'Space') {
                e.preventDefault();
                togglePlayPause();
            }
        }
    });
    
    // Arrow keys for volume when audio player is visible
    document.addEventListener('keydown', (e) => {
        if (audioPlayer.style.display !== 'none' && e.target.tagName !== 'INPUT') {
            if (e.code === 'ArrowUp') {
                e.preventDefault();
                const currentVolume = parseInt(volumeSlider.value);
                const newVolume = Math.min(100, currentVolume + 5);
                volumeSlider.value = newVolume;
                handleVolumeChange();
            } else if (e.code === 'ArrowDown') {
                e.preventDefault();
                const currentVolume = parseInt(volumeSlider.value);
                const newVolume = Math.max(0, currentVolume - 5);
                volumeSlider.value = newVolume;
                handleVolumeChange();
            }
        }
    });
}

// Form validation
function handleInputValidation() {
    const value = musicDescription.value.trim();
    const isValid = value.length >= MIN_DESCRIPTION_LENGTH;
    
    if (value.length > 0 && !isValid) {
        showError(`Please enter at least ${MIN_DESCRIPTION_LENGTH} characters.`);
        musicDescription.setAttribute('aria-invalid', 'true');
    } else {
        hideError();
        musicDescription.setAttribute('aria-invalid', 'false');
    }
    
    return isValid;
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const description = musicDescription.value.trim();
    
    // Validate input
    if (description.length < MIN_DESCRIPTION_LENGTH) {
        showError(`Please enter at least ${MIN_DESCRIPTION_LENGTH} characters describing your music.`);
        musicDescription.focus();
        return;
    }
    
    // Clear previous errors and audio
    hideError();
    hideAudioPlayer();
    
    // Start generation
    generateMusic(description);
}

// Music generation using abstraction layer
async function generateMusic(description) {
    // Show loading state
    setLoadingState(true);
    showStatus('Generating your music...', 'info');
    
    try {
        const generator = musicGeneratorManager.getCurrentGenerator();
        const generatorName = generator ? generator.getName() : 'Unknown';
        
        console.log(`Using generator: ${generatorName}`);
        
        // Progress callback
        const onProgress = (progress) => {
            showStatus(`Generating your music... ${progress}%`, 'info');
        };
        
        // Generate music using the abstraction layer
        const result = await musicGeneratorManager.generate(description, onProgress);
        
        // Handle result (can be AudioBuffer or URL string)
        if (result instanceof AudioBuffer) {
            // Tone.js generated AudioBuffer - convert to blob URL
            await loadAudioFromBuffer(result);
        } else if (typeof result === 'string') {
            // API returned URL
            loadAudio(result);
        } else {
            throw new Error('Unexpected result type from generator');
        }
        
    } catch (error) {
        console.error('Generation error:', error);
        showStatus(
            `Error generating music: ${error.message}. Please try again.`,
            'error'
        );
        setLoadingState(false);
    }
}

// Audio handling
function loadAudio(audioUrl) {
    setLoadingState(false);
    
    // Set audio source
    audioElement.src = audioUrl;
    
    // Reset audio state
    isPlaying = false;
    audioElement.pause();
    audioElement.currentTime = 0;
    
    // Show audio player
    showAudioPlayer();
    
    // Preload audio
    audioElement.load();
}

/**
 * Load audio from an AudioBuffer (for Tone.js generated audio)
 */
async function loadAudioFromBuffer(audioBuffer) {
    setLoadingState(false);
    
    try {
        // Convert AudioBuffer to WAV blob
        const wav = audioBufferToWav(audioBuffer);
        const blob = new Blob([wav], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        // Set audio source
        audioElement.src = url;
        
        // Reset audio state
        isPlaying = false;
        audioElement.pause();
        audioElement.currentTime = 0;
        
        // Show audio player
        showAudioPlayer();
        
        // Preload audio
        audioElement.load();
        
        // Cleanup URL when audio is done
        audioElement.addEventListener('ended', () => {
            URL.revokeObjectURL(url);
        }, { once: true });
        
    } catch (error) {
        console.error('Error loading audio from buffer:', error);
        throw error;
    }
}

/**
 * Convert AudioBuffer to WAV format
 * Simple implementation for converting AudioBuffer to WAV blob
 */
function audioBufferToWav(buffer) {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);
    const channels = [];
    let offset = 0;
    let pos = 0;
    
    // Write WAV header
    const writeString = (str) => {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(pos++, str.charCodeAt(i));
        }
    };
    
    writeString('RIFF');
    view.setUint32(pos, 36 + length * numberOfChannels * 2, true);
    pos += 4;
    writeString('WAVE');
    writeString('fmt ');
    view.setUint32(pos, 16, true);
    pos += 4;
    view.setUint16(pos, 1, true);
    pos += 2;
    view.setUint16(pos, numberOfChannels, true);
    pos += 2;
    view.setUint32(pos, sampleRate, true);
    pos += 4;
    view.setUint32(pos, sampleRate * numberOfChannels * 2, true);
    pos += 4;
    view.setUint16(pos, numberOfChannels * 2, true);
    pos += 2;
    view.setUint16(pos, 16, true);
    pos += 2;
    writeString('data');
    view.setUint32(pos, length * numberOfChannels * 2, true);
    pos += 4;
    
    // Write audio data
    for (let i = 0; i < numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }
    
    for (let i = 0; i < length; i++) {
        for (let channel = 0; channel < numberOfChannels; channel++) {
            let sample = Math.max(-1, Math.min(1, channels[channel][i]));
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(pos, sample, true);
            pos += 2;
        }
    }
    
    return arrayBuffer;
}

function showAudioPlayer() {
    audioPlayer.style.display = 'block';
    audioSection.setAttribute('aria-hidden', 'false');
    playPauseButton.focus();
}

function hideAudioPlayer() {
    audioPlayer.style.display = 'none';
    audioSection.setAttribute('aria-hidden', 'true');
    if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
    }
}

function togglePlayPause() {
    if (!audioElement.src) {
        return;
    }
    
    if (isPlaying) {
        audioElement.pause();
    } else {
        const playPromise = audioElement.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.error('Playback error:', error);
                showStatus('Error playing audio. Please try again.', 'error');
            });
        }
    }
}

function updatePlayPauseButton() {
    if (isPlaying) {
        playPauseButton.setAttribute('aria-label', 'Pause the generated music');
        playPauseButton.setAttribute('aria-pressed', 'true');
        playPauseButton.classList.add('playing');
        playPauseButton.querySelector('.button-label').textContent = 'Pause';
    } else {
        playPauseButton.setAttribute('aria-label', 'Play the generated music');
        playPauseButton.setAttribute('aria-pressed', 'false');
        playPauseButton.classList.remove('playing');
        playPauseButton.querySelector('.button-label').textContent = 'Play';
    }
}

function handleVolumeChange() {
    const volume = parseInt(volumeSlider.value);
    audioElement.volume = volume / 100;
    volumeValue.textContent = `${volume}%`;
    volumeSlider.setAttribute('aria-valuenow', volume);
    
    // Update mute state
    if (volume === 0) {
        isMuted = true;
        volumeButton.setAttribute('aria-pressed', 'true');
        volumeButton.setAttribute('aria-label', 'Unmute audio');
    } else {
        isMuted = false;
        volumeButton.setAttribute('aria-pressed', 'false');
        volumeButton.setAttribute('aria-label', 'Mute audio');
    }
}

function toggleMute() {
    if (isMuted) {
        // Unmute - restore saved volume or default to 50%
        const volumeToRestore = savedVolume > 0 ? savedVolume : 50;
        volumeSlider.value = volumeToRestore;
        handleVolumeChange();
    } else {
        // Mute - save current volume and set to 0
        savedVolume = parseInt(volumeSlider.value);
        volumeSlider.value = 0;
        handleVolumeChange();
    }
}

// UI helpers
function setLoadingState(loading) {
    if (loading) {
        generateButton.disabled = true;
        generateButton.classList.add('loading');
        musicDescription.disabled = true;
    } else {
        generateButton.disabled = false;
        generateButton.classList.remove('loading');
        musicDescription.disabled = false;
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    errorMessage.setAttribute('role', 'alert');
}

function hideError() {
    errorMessage.classList.remove('show');
    errorMessage.textContent = '';
}

function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message show ${type}`;
    statusMessage.setAttribute('role', 'status');
}

function hideStatus() {
    statusMessage.classList.remove('show');
    statusMessage.textContent = '';
}
