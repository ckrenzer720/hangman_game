// ========================================
// AUDIO MANAGER - HANGMAN GAME
// ========================================

/**
 * AudioManager class for audio feedback, sound effects, and screen reader support
 */
class AudioManager {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.volume = options.volume !== undefined ? options.volume : 0.5;
    this.soundEffectsEnabled = options.soundEffectsEnabled !== undefined ? options.soundEffectsEnabled : false;
    this.screenReaderEnabled = options.screenReaderEnabled !== undefined ? options.screenReaderEnabled : true;
    this.accessibilityManager = options.accessibilityManager || null;
    this.preferencesManager = options.preferencesManager || null;
    
    // Audio context for sound effects
    this.audioContext = null;
    this.audioBuffers = new Map();
    
    // Initialize audio context (lazy initialization)
    this.initAudioContext();
    
    // Load preferences if available
    this.loadPreferences();
  }

  /**
   * Initialize Web Audio API context
   */
  initAudioContext() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioContext = new AudioContext();
      }
    } catch (error) {
      console.warn('[AudioManager] Web Audio API not available:', error);
    }
  }

  /**
   * Load preferences from preferences manager
   */
  loadPreferences() {
    if (this.preferencesManager) {
      this.soundEffectsEnabled = this.preferencesManager.get('sound', false);
      this.volume = this.preferencesManager.get('soundVolume', 0.5);
      this.screenReaderEnabled = this.preferencesManager.get('screenReader', true);
    }
  }

  /**
   * Set sound effects enabled state
   * @param {boolean} enabled - Whether sound effects are enabled
   */
  setSoundEffectsEnabled(enabled) {
    this.soundEffectsEnabled = enabled;
    if (this.preferencesManager) {
      this.preferencesManager.set('sound', enabled);
    }
  }

  /**
   * Set volume level
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.preferencesManager) {
      this.preferencesManager.set('soundVolume', this.volume);
    }
  }

  /**
   * Get current volume
   * @returns {number} Current volume (0.0 to 1.0)
   */
  getVolume() {
    return this.volume;
  }

  /**
   * Check if sound effects are enabled
   * @returns {boolean} True if sound effects are enabled
   */
  isSoundEffectsEnabled() {
    return this.soundEffectsEnabled && this.enabled;
  }

  /**
   * Play a sound effect
   * @param {string} soundName - Name of the sound to play
   * @param {Object} options - Additional options (volume, pitch, etc.)
   */
  playSound(soundName, options = {}) {
    if (!this.isSoundEffectsEnabled()) {
      return;
    }

    const volume = options.volume !== undefined ? options.volume : this.volume;
    
    // Resume audio context if suspended (required by some browsers)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(err => {
        console.warn('[AudioManager] Could not resume audio context:', err);
      });
    }

    // Generate sound using Web Audio API
    this.generateSound(soundName, volume, options);
  }

  /**
   * Generate sound effect using Web Audio API
   * @param {string} soundName - Name of the sound
   * @param {number} volume - Volume level
   * @param {Object} options - Sound options
   */
  generateSound(soundName, volume, options = {}) {
    if (!this.audioContext) {
      return;
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    // Configure sound based on type
    const soundConfig = this.getSoundConfig(soundName, options);
    
    oscillator.type = soundConfig.type || 'sine';
    oscillator.frequency.setValueAtTime(soundConfig.frequency, this.audioContext.currentTime);
    
    // Volume envelope
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * soundConfig.volume, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + soundConfig.duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + soundConfig.duration);
  }

  /**
   * Get sound configuration for different sound types
   * @param {string} soundName - Name of the sound
   * @param {Object} options - Additional options
   * @returns {Object} Sound configuration
   */
  getSoundConfig(soundName, options = {}) {
    const configs = {
      'correct': {
        type: 'sine',
        frequency: 800,
        duration: 0.2,
        volume: 0.3
      },
      'incorrect': {
        type: 'sawtooth',
        frequency: 200,
        duration: 0.15,
        volume: 0.2
      },
      'win': {
        type: 'sine',
        frequency: 600,
        duration: 0.1,
        volume: 0.4,
        // Play a sequence for win sound
        sequence: [
          { frequency: 523.25, time: 0 },   // C
          { frequency: 659.25, time: 0.1 }, // E
          { frequency: 783.99, time: 0.2 }  // G
        ]
      },
      'lose': {
        type: 'sawtooth',
        frequency: 150,
        duration: 0.5,
        volume: 0.3
      },
      'hint': {
        type: 'sine',
        frequency: 400,
        duration: 0.15,
        volume: 0.25
      },
      'button': {
        type: 'sine',
        frequency: 500,
        duration: 0.05,
        volume: 0.15
      },
      'notification': {
        type: 'sine',
        frequency: 600,
        duration: 0.1,
        volume: 0.2
      }
    };

    const config = configs[soundName] || configs['button'];
    
    // Override with options if provided
    if (options.frequency) config.frequency = options.frequency;
    if (options.duration) config.duration = options.duration;
    if (options.type) config.type = options.type;

    return config;
  }

  /**
   * Play a sequence of sounds (for win sound, etc.)
   * @param {Array} sequence - Array of sound configurations
   * @param {number} volume - Volume level
   */
  playSequence(sequence, volume) {
    sequence.forEach((note, index) => {
      setTimeout(() => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(note.frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.3, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
      }, note.time * 1000);
    });
  }

  /**
   * Announce message to screen reader
   * @param {string} message - Message to announce
   * @param {string} priority - Priority: 'polite' or 'assertive'
   */
  announce(message, priority = 'polite') {
    if (!this.screenReaderEnabled || !this.enabled) {
      return;
    }

    // Use accessibility manager if available
    if (this.accessibilityManager && typeof this.accessibilityManager.announce === 'function') {
      this.accessibilityManager.announce(message, priority);
      return;
    }

    // Fallback: create live region if accessibility manager not available
    let liveRegion = document.getElementById('audio-announce-region');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'audio-announce-region';
      liveRegion.setAttribute('role', priority === 'assertive' ? 'alert' : 'status');
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.style.cssText = 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;';
      document.body.appendChild(liveRegion);
    }

    // Clear and announce
    liveRegion.textContent = '';
    setTimeout(() => {
      liveRegion.textContent = message;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }, 100);
  }

  /**
   * Play audio cue for correct guess
   * @param {string} letter - Guessed letter
   * @param {Object} context - Additional context
   */
  playCorrectGuess(letter, context = {}) {
    this.playSound('correct');
    this.announce(`Correct! The letter ${letter} is in the word.`, 'polite');
  }

  /**
   * Play audio cue for incorrect guess
   * @param {string} letter - Guessed letter
   * @param {Object} context - Additional context
   */
  playIncorrectGuess(letter, context = {}) {
    this.playSound('incorrect');
    const remaining = context.remainingGuesses !== undefined 
      ? `${context.remainingGuesses} guesses remaining`
      : '';
    this.announce(`Incorrect. The letter ${letter} is not in the word. ${remaining}`, 'polite');
  }

  /**
   * Play audio cue for win
   * @param {Object} context - Additional context
   */
  playWin(context = {}) {
    const config = this.getSoundConfig('win');
    if (config.sequence) {
      this.playSequence(config.sequence, this.volume);
    } else {
      this.playSound('win');
    }
    this.announce(`Congratulations! You won! The word was ${context.word || 'the word'}.`, 'assertive');
  }

  /**
   * Play audio cue for lose
   * @param {Object} context - Additional context
   */
  playLose(context = {}) {
    this.playSound('lose');
    this.announce(`Game over. The word was ${context.word || 'the word'}.`, 'assertive');
  }

  /**
   * Play audio cue for hint
   * @param {Object} context - Additional context
   */
  playHint(context = {}) {
    this.playSound('hint');
    this.announce(`Hint: A letter has been revealed.`, 'polite');
  }

  /**
   * Play audio cue for button click
   */
  playButtonClick() {
    this.playSound('button');
  }

  /**
   * Play audio cue for notification
   * @param {string} message - Notification message
   */
  playNotification(message) {
    this.playSound('notification');
    this.announce(message, 'polite');
  }

  /**
   * Announce game state change
   * @param {string} state - New game state
   * @param {Object} context - Additional context
   */
  announceGameState(state, context = {}) {
    const messages = {
      'playing': 'Game started. Guess letters to reveal the word.',
      'won': `Congratulations! You won! The word was ${context.word || 'the word'}.`,
      'lost': `Game over. The word was ${context.word || 'the word'}.`,
      'paused': 'Game paused. Press space or click resume to continue.',
      'resumed': 'Game resumed. Continue guessing letters.'
    };

    const message = messages[state] || `Game state: ${state}`;
    this.announce(message, state === 'won' || state === 'lost' ? 'assertive' : 'polite');
  }

  /**
   * Test audio system
   * @returns {boolean} True if audio is working
   */
  testAudio() {
    try {
      if (this.audioContext) {
        this.playSound('button');
        return true;
      }
      return false;
    } catch (error) {
      console.error('[AudioManager] Audio test failed:', error);
      return false;
    }
  }

  /**
   * Get audio status
   * @returns {Object} Audio status information
   */
  getStatus() {
    return {
      enabled: this.enabled,
      soundEffectsEnabled: this.soundEffectsEnabled,
      screenReaderEnabled: this.screenReaderEnabled,
      volume: this.volume,
      audioContextAvailable: this.audioContext !== null,
      audioContextState: this.audioContext ? this.audioContext.state : 'unavailable'
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioManager;
}

