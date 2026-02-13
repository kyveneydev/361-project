/**
 * Tone.js-based music generator implementation
 * 
 * Generates music client-side using Tone.js Web Audio API.
 * Parses text descriptions to extract musical parameters and generates
 * patterns accordingly.
 */
class ToneMusicGenerator extends MusicGenerator {
    constructor() {
        super();
        this.isInitialized = false;
        this.audioContext = null;
        this.recorder = null;
        this.recording = false;
    }
    
    getName() {
        return 'Tone.js Generator';
    }
    
    async isAvailable() {
        // Check if Tone.js is loaded
        if (typeof Tone === 'undefined') {
            return false;
        }
        
        // Initialize Tone.js if not already done
        if (!this.isInitialized) {
            try {
                await Tone.start();
                this.isInitialized = true;
            } catch (error) {
                console.error('Failed to initialize Tone.js:', error);
                return false;
            }
        }
        
        return true;
    }
    
    async generate(description, onProgress) {
        if (!await this.isAvailable()) {
            throw new Error('Tone.js is not available');
        }
        
        // Parse description to extract musical parameters
        const params = this._parseDescription(description);
        
        // Report progress
        if (onProgress) onProgress(10);
        
        // Generate music
        const audioBuffer = await this._generateMusic(params, onProgress);
        
        return audioBuffer;
    }
    
    /**
     * Parse text description to extract musical parameters
     * @private
     */
    _parseDescription(description) {
        const desc = description.toLowerCase();
        
        const params = {
            tempo: 120,
            key: 'C',
            scale: 'major',
            instruments: [],
            mood: 'neutral',
            duration: 5.0, // seconds
            complexity: 'medium'
        };
        
        // Tempo detection
        if (desc.includes('slow') || desc.includes('lento') || desc.includes('adagio')) {
            params.tempo = 60;
        } else if (desc.includes('fast') || desc.includes('allegro') || desc.includes('presto')) {
            params.tempo = 160;
        } else if (desc.includes('moderate') || desc.includes('andante')) {
            params.tempo = 100;
        } else if (desc.includes('upbeat') || desc.includes('energetic')) {
            params.tempo = 140;
        }
        
        // Key detection
        const keys = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];
        for (const key of keys) {
            if (desc.includes(`key of ${key}`) || desc.includes(`${key} major`) || desc.includes(`${key} minor`)) {
                params.key = key.toUpperCase();
                if (desc.includes('minor')) {
                    params.scale = 'minor';
                }
                break;
            }
        }
        
        // Scale detection
        if (desc.includes('minor')) {
            params.scale = 'minor';
        } else if (desc.includes('major')) {
            params.scale = 'major';
        }
        
        // Instrument detection
        if (desc.includes('piano')) params.instruments.push('piano');
        if (desc.includes('guitar')) params.instruments.push('guitar');
        if (desc.includes('drums') || desc.includes('drum')) params.instruments.push('drums');
        if (desc.includes('bass')) params.instruments.push('bass');
        if (desc.includes('violin')) params.instruments.push('violin');
        if (desc.includes('flute')) params.instruments.push('flute');
        if (desc.includes('trumpet')) params.instruments.push('trumpet');
        if (desc.includes('saxophone') || desc.includes('sax')) params.instruments.push('saxophone');
        
        // Default instruments if none specified
        if (params.instruments.length === 0) {
            params.instruments = ['piano', 'bass'];
        }
        
        // Mood detection
        if (desc.includes('happy') || desc.includes('joyful') || desc.includes('cheerful')) {
            params.mood = 'happy';
            params.scale = 'major';
        } else if (desc.includes('sad') || desc.includes('melancholic') || desc.includes('somber')) {
            params.mood = 'sad';
            params.scale = 'minor';
        } else if (desc.includes('energetic') || desc.includes('intense') || desc.includes('powerful')) {
            params.mood = 'energetic';
            params.tempo = Math.max(params.tempo, 140);
        } else if (desc.includes('calm') || desc.includes('peaceful') || desc.includes('relaxing')) {
            params.mood = 'calm';
            params.tempo = Math.min(params.tempo, 90);
        }
        
        // Duration detection
        if (desc.includes('short')) {
            params.duration = 3.0;
        } else if (desc.includes('long')) {
            params.duration = 10.0;
        }
        
        // Complexity detection
        if (desc.includes('simple') || desc.includes('minimal')) {
            params.complexity = 'simple';
        } else if (desc.includes('complex') || desc.includes('intricate')) {
            params.complexity = 'complex';
        }
        
        return params;
    }
    
    /**
     * Generate music using Tone.js based on parameters
     * @private
     */
    async _generateMusic(params, onProgress) {
        return new Promise(async (resolve, reject) => {
            try {
                if (onProgress) onProgress(20);
                
                // Create a recorder to capture the audio
                const recorder = new Tone.Recorder();
                recorder.start();
                
                // Create instruments based on parameters
                const instruments = [];
                
                if (onProgress) onProgress(30);
                
                // Create synths for each instrument and connect to recorder
                for (const instrumentName of params.instruments) {
                    const synth = this._createInstrument(instrumentName);
                    if (synth) {
                        synth.connect(recorder);
                        instruments.push(synth);
                    }
                }
                
                if (onProgress) onProgress(50);
                
                // Generate notes based on key and scale
                const notes = this._generateNotes(params);
                
                // Create a sequence
                const now = Tone.now();
                const duration = params.duration;
                const beatDuration = 60 / params.tempo; // seconds per beat
                
                // Schedule notes
                let noteIndex = 0;
                const totalBeats = Math.floor(duration / beatDuration);
                
                for (let beat = 0; beat < totalBeats; beat++) {
                    const time = now + (beat * beatDuration);
                    
                    // Distribute notes across instruments
                    instruments.forEach((synth, instIndex) => {
                        const note = notes[(noteIndex + instIndex) % notes.length];
                        const velocity = this._getVelocity(params, beat, instIndex);
                        
                        synth.triggerAttackRelease(note, beatDuration * 0.8, time, velocity);
                    });
                    
                    noteIndex += instruments.length;
                    
                    // Update progress
                    if (onProgress && beat % Math.max(1, Math.floor(totalBeats / 10)) === 0) {
                        const progress = 50 + Math.floor((beat / totalBeats) * 40);
                        onProgress(progress);
                    }
                }
                
                // Wait for music to finish playing
                await new Promise(resolve => setTimeout(resolve, (duration + 1) * 1000));
                
                if (onProgress) onProgress(95);
                
                // Stop recording and get the blob
                const recording = await recorder.stop();
                
                // Stop all synths
                instruments.forEach(synth => {
                    synth.dispose();
                });
                
                // Convert blob to AudioBuffer
                const arrayBuffer = await recording.arrayBuffer();
                const audioBuffer = await Tone.context.decodeAudioData(arrayBuffer);
                
                // Cleanup recorder
                recorder.dispose();
                
                if (onProgress) onProgress(100);
                
                resolve(audioBuffer);
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Create a Tone.js instrument based on name
     * @private
     */
    _createInstrument(name) {
        switch (name.toLowerCase()) {
            case 'piano':
                return new Tone.PolySynth(Tone.Synth).set({
                    oscillator: { type: 'triangle' },
                    envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 0.5 }
                });
            case 'guitar':
                return new Tone.PolySynth(Tone.Synth).set({
                    oscillator: { type: 'sawtooth' },
                    envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8 }
                });
            case 'bass':
                return new Tone.MonoSynth({
                    oscillator: { type: 'square' },
                    envelope: { attack: 0.01, decay: 0.1, sustain: 0.4, release: 0.3 },
                    filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.1, baseFrequency: 200, octaves: 2 }
                });
            case 'drums':
                // Use a noise-based synth for drums
                return new Tone.Noise({
                    type: 'pink',
                    volume: -10
                });
            case 'violin':
                return new Tone.PolySynth(Tone.Synth).set({
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.3, decay: 0.2, sustain: 0.5, release: 0.5 }
                });
            case 'flute':
                return new Tone.PolySynth(Tone.Synth).set({
                    oscillator: { type: 'sine' },
                    envelope: { attack: 0.1, decay: 0.1, sustain: 0.7, release: 0.3 }
                });
            case 'trumpet':
                return new Tone.PolySynth(Tone.Synth).set({
                    oscillator: { type: 'square' },
                    envelope: { attack: 0.05, decay: 0.1, sustain: 0.4, release: 0.2 }
                });
            case 'saxophone':
                return new Tone.PolySynth(Tone.Synth).set({
                    oscillator: { type: 'sawtooth' },
                    envelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.4 }
                });
            default:
                return new Tone.PolySynth(Tone.Synth);
        }
    }
    
    /**
     * Generate notes based on key and scale
     * @private
     */
    _generateNotes(params) {
        const key = params.key;
        const scale = params.scale;
        
        // Note intervals for major and minor scales
        const majorIntervals = [0, 2, 4, 5, 7, 9, 11]; // C, D, E, F, G, A, B
        const minorIntervals = [0, 2, 3, 5, 7, 8, 10]; // C, D, Eb, F, G, Ab, Bb
        
        const intervals = scale === 'major' ? majorIntervals : minorIntervals;
        
        // Convert key to MIDI note number (C4 = 60)
        const keyNotes = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
        const baseNote = 60 + (keyNotes[key] || 0); // C4 octave
        
        // Generate notes in the scale
        const notes = intervals.map(interval => {
            const midiNote = baseNote + interval;
            return Tone.Frequency(midiNote, 'midi').toNote();
        });
        
        return notes;
    }
    
    /**
     * Get velocity based on mood and position
     * @private
     */
    _getVelocity(params, beat, instrumentIndex) {
        let baseVelocity = 0.5;
        
        if (params.mood === 'energetic') {
            baseVelocity = 0.7;
        } else if (params.mood === 'calm') {
            baseVelocity = 0.3;
        }
        
        // Add some variation
        const variation = (Math.sin(beat * 0.5) + 1) * 0.2;
        return Math.min(1, Math.max(0.1, baseVelocity + variation));
    }
    
    cleanup() {
        // Cleanup any resources
        if (this.recorder) {
            this.recorder.dispose();
        }
    }
}
