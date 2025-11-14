// ========================================
// TOUCH ACCESSIBILITY MANAGER - HANGMAN GAME
// ========================================

/**
 * TouchAccessibilityManager class for touch gestures, voice input, and switch control
 */
class TouchAccessibilityManager {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.game = options.game || null;
    this.ui = options.ui || null;
    
    // Gesture detection
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.minSwipeDistance = 50; // Minimum distance for swipe detection
    
    // Long press detection
    this.longPressTimer = null;
    this.longPressDelay = 500; // 500ms for long press
    
    // Voice input
    this.recognition = null;
    this.isListening = false;
    this.voiceInputEnabled = false;
    
    // Switch control
    this.switchControlEnabled = false;
    this.switchControlActive = false;
    this.switchControlInterval = null;
    this.switchControlDelay = 1000; // 1 second between switches
    
    if (this.enabled) {
      this.init();
    }
  }

  /**
   * Initialize touch accessibility features
   */
  init() {
    this.initGestureSupport();
    this.initVoiceInput();
    this.initSwitchControl();
    this.enhanceTouchTargets();
  }

  /**
   * Initialize gesture support
   */
  initGestureSupport() {
    if (!GameUtils.isTouchDevice()) {
      return;
    }

    // Add touch event listeners to game container
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
      gameContainer.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: true });
      gameContainer.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: true });
      gameContainer.addEventListener('touchcancel', (e) => this.handleTouchCancel(e), { passive: true });
    }

    // Add long press support to keyboard keys
    const keyboard = document.getElementById('keyboard');
    if (keyboard) {
      keyboard.addEventListener('touchstart', (e) => this.handleLongPressStart(e), { passive: true });
      keyboard.addEventListener('touchend', (e) => this.handleLongPressEnd(e), { passive: true });
      keyboard.addEventListener('touchmove', (e) => this.handleLongPressCancel(e), { passive: true });
    }
  }

  /**
   * Handle touch start
   */
  handleTouchStart(e) {
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  /**
   * Handle touch end - detect swipe gestures
   */
  handleTouchEnd(e) {
    if (!e.changedTouches || e.changedTouches.length === 0) return;
    
    const touch = e.changedTouches[0];
    this.touchEndX = touch.clientX;
    this.touchEndY = touch.clientY;

    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Only process if swipe distance is significant
    if (distance < this.minSwipeDistance) {
      return;
    }

    // Determine swipe direction
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY) {
      // Horizontal swipe
      if (deltaX > 0) {
        this.handleSwipeRight();
      } else {
        this.handleSwipeLeft();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        this.handleSwipeDown();
      } else {
        this.handleSwipeUp();
      }
    }
  }

  /**
   * Handle touch cancel
   */
  handleTouchCancel(e) {
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
  }

  /**
   * Handle swipe right - next action or next keyboard key
   */
  handleSwipeRight() {
    if (this.switchControlActive) {
      this.advanceSwitchControl();
      return;
    }
    
    // Navigate to next keyboard key
    this.navigateKeyboardKey('next');
  }

  /**
   * Handle swipe left - previous action or previous keyboard key
   */
  handleSwipeLeft() {
    if (this.switchControlActive) {
      this.advanceSwitchControl();
      return;
    }
    
    // Navigate to previous keyboard key
    this.navigateKeyboardKey('previous');
  }

  /**
   * Handle swipe up - show help or settings
   */
  handleSwipeUp() {
    if (this.ui && typeof this.ui.showHelp === 'function') {
      this.ui.showHelp();
    }
  }

  /**
   * Handle swipe down - close modals or show statistics
   */
  handleSwipeDown() {
    // Close any open modals
    if (this.ui && typeof this.ui.handleEscapeKey === 'function') {
      this.ui.handleEscapeKey();
    } else if (this.ui && typeof this.ui.showStatistics === 'function') {
      this.ui.showStatistics();
    }
  }

  /**
   * Navigate keyboard keys
   */
  navigateKeyboardKey(direction) {
    const keyboard = document.getElementById('keyboard');
    if (!keyboard) return;

    const keys = Array.from(keyboard.querySelectorAll('.keyboard-key:not([disabled])'));
    if (keys.length === 0) return;

    const currentFocus = document.activeElement;
    const currentIndex = keys.indexOf(currentFocus);

    let newIndex;
    if (currentIndex === -1) {
      newIndex = 0;
    } else if (direction === 'next') {
      newIndex = (currentIndex + 1) % keys.length;
    } else {
      newIndex = (currentIndex - 1 + keys.length) % keys.length;
    }

    keys[newIndex].focus();
  }

  /**
   * Handle long press start
   */
  handleLongPressStart(e) {
    if (!e.target.classList.contains('keyboard-key') || e.target.disabled) {
      return;
    }

    this.longPressTimer = setTimeout(() => {
      this.handleLongPress(e.target);
    }, this.longPressDelay);
  }

  /**
   * Handle long press end
   */
  handleLongPressEnd(e) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  /**
   * Handle long press cancel
   */
  handleLongPressCancel(e) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  /**
   * Handle long press action - show letter info or hint
   */
  handleLongPress(keyElement) {
    const letter = keyElement.getAttribute('data-letter');
    if (letter && this.ui) {
      // Show feedback about the letter
      const isGuessed = this.game && this.game.gameState.guessedLetters.includes(letter);
      if (isGuessed) {
        const isCorrect = this.game.gameState.currentWord.includes(letter);
        this.ui.showFeedback(
          'info',
          `Letter ${letter.toUpperCase()} is ${isCorrect ? 'correct' : 'incorrect'}`
        );
      } else {
        this.ui.showFeedback('info', `Press to guess letter ${letter.toUpperCase()}`);
      }
    }
  }

  /**
   * Initialize voice input using Web Speech API
   */
  initVoiceInput() {
    // Check if Web Speech API is available
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('[TouchAccessibility] Web Speech API not available');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.trim().toLowerCase();
      this.handleVoiceInput(transcript);
    };

    this.recognition.onerror = (event) => {
      console.warn('[TouchAccessibility] Speech recognition error:', event.error);
      if (this.ui) {
        this.ui.showFeedback('error', 'Voice input error. Please try again.');
      }
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };
  }

  /**
   * Handle voice input
   */
  handleVoiceInput(transcript) {
    if (!this.game || !this.ui) return;

    // Extract letters from transcript
    const letters = transcript.match(/[a-z]/g);
    if (!letters || letters.length === 0) {
      this.ui.showFeedback('error', 'No letters detected. Please say a letter.');
      return;
    }

    // Use the first letter
    const letter = letters[0];
    const validation = GameUtils.validateHangmanInput(letter);

    if (validation.isValid) {
      this.ui.makeGuess(validation.sanitizedInput);
      this.ui.showFeedback('success', `Guessed letter: ${letter.toUpperCase()}`);
    } else {
      this.ui.showFeedback('error', validation.errorMessage);
    }
  }

  /**
   * Start voice input
   */
  startVoiceInput() {
    if (!this.recognition) {
      if (this.ui) {
        this.ui.showFeedback('error', 'Voice input is not available in this browser.');
      }
      return;
    }

    if (this.isListening) {
      this.stopVoiceInput();
      return;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      if (this.ui) {
        this.ui.showFeedback('info', 'Listening... Say a letter.');
      }
    } catch (error) {
      console.warn('[TouchAccessibility] Could not start voice recognition:', error);
      if (this.ui) {
        this.ui.showFeedback('error', 'Could not start voice input.');
      }
    }
  }

  /**
   * Stop voice input
   */
  stopVoiceInput() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Toggle voice input
   */
  toggleVoiceInput() {
    this.voiceInputEnabled = !this.voiceInputEnabled;
    if (this.voiceInputEnabled) {
      this.startVoiceInput();
    } else {
      this.stopVoiceInput();
    }
  }

  /**
   * Initialize switch control support
   */
  initSwitchControl() {
    // Switch control can be activated via keyboard (Space key held)
    // or via a special button
    document.addEventListener('keydown', (e) => {
      if (e.key === ' ' && e.repeat) {
        // Space key held down - activate switch control
        if (!this.switchControlActive) {
          this.activateSwitchControl();
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.key === ' ') {
        // Space key released - deactivate switch control
        if (this.switchControlActive) {
          this.deactivateSwitchControl();
        }
      }
    });
  }

  /**
   * Activate switch control
   */
  activateSwitchControl() {
    this.switchControlActive = true;
    this.switchControlIndex = 0;
    
    // Get all focusable elements
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) return;

    // Focus first element
    focusableElements[0].focus();
    
    // Show feedback
    if (this.ui) {
      this.ui.showFeedback('info', 'Switch control activated. Use space to navigate.');
    }

    // Auto-advance after delay
    this.switchControlInterval = setInterval(() => {
      this.advanceSwitchControl();
    }, this.switchControlDelay);
  }

  /**
   * Deactivate switch control
   */
  deactivateSwitchControl() {
    this.switchControlActive = false;
    if (this.switchControlInterval) {
      clearInterval(this.switchControlInterval);
      this.switchControlInterval = null;
    }
    if (this.ui) {
      this.ui.showFeedback('info', 'Switch control deactivated.');
    }
  }

  /**
   * Advance switch control to next element
   */
  advanceSwitchControl() {
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length === 0) return;

    this.switchControlIndex = (this.switchControlIndex + 1) % focusableElements.length;
    focusableElements[this.switchControlIndex].focus();
  }

  /**
   * Get all focusable elements
   */
  getFocusableElements() {
    const selector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    return Array.from(document.querySelectorAll(selector)).filter(el => {
      return el.offsetWidth > 0 && el.offsetHeight > 0 && window.getComputedStyle(el).visibility !== 'hidden';
    });
  }

  /**
   * Enhance touch targets for better accessibility
   */
  enhanceTouchTargets() {
    if (!GameUtils.isTouchDevice()) {
      return;
    }

    // Add touch-friendly classes
    const style = document.createElement('style');
    style.textContent = `
      @media (pointer: coarse) {
        .btn, .keyboard-key {
          min-height: 44px;
          min-width: 44px;
          padding: 12px;
        }
        
        .btn {
          min-height: 48px;
        }
        
        .keyboard-key {
          touch-action: manipulation;
        }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      voiceInputAvailable: this.recognition !== null,
      voiceInputEnabled: this.voiceInputEnabled,
      isListening: this.isListening,
      switchControlActive: this.switchControlActive,
      isTouchDevice: GameUtils.isTouchDevice()
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TouchAccessibilityManager;
}

