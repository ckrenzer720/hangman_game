// ========================================
// ACCESSIBILITY MANAGER - HANGMAN GAME
// ========================================

/**
 * AccessibilityManager class for ARIA labels, live regions, and focus management
 */
class AccessibilityManager {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.announceDelay = options.announceDelay || 100;
    this.liveRegions = new Map();
    this.focusHistory = [];
    this.skipLinks = [];
    
    if (this.enabled) {
      this.init();
    }
  }

  /**
   * Initialize accessibility manager
   */
  init() {
    this.createLiveRegions();
    this.setupSkipLinks();
    this.setupKeyboardShortcuts();
  }

  /**
   * Create live regions for screen reader announcements
   */
  createLiveRegions() {
    const regions = {
      status: { priority: 'polite', id: 'aria-status' },
      alert: { priority: 'assertive', id: 'aria-alert' },
      log: { priority: 'polite', id: 'aria-log' }
    };

    Object.entries(regions).forEach(([name, config]) => {
      let region = document.getElementById(config.id);
      
      if (!region) {
        region = document.createElement('div');
        region.id = config.id;
        region.setAttribute('role', name === 'alert' ? 'alert' : 'status');
        region.setAttribute('aria-live', config.priority);
        region.setAttribute('aria-atomic', 'true');
        region.className = 'sr-only';
        region.style.cssText = 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;';
        document.body.appendChild(region);
      }

      this.liveRegions.set(name, region);
    });
  }

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - Priority: 'polite' or 'assertive'
   */
  announce(message, priority = 'polite') {
    if (!this.enabled || !message) return;

    const regionName = priority === 'assertive' ? 'alert' : 'status';
    const region = this.liveRegions.get(regionName);

    if (region) {
      // Clear previous message
      region.textContent = '';
      
      // Announce after a brief delay to ensure screen reader picks it up
      setTimeout(() => {
        region.textContent = message;
        
        // Clear after announcement (for some screen readers)
        setTimeout(() => {
          region.textContent = '';
        }, 1000);
      }, this.announceDelay);
    }
  }

  /**
   * Set ARIA label on element
   * @param {Element} element - Element to label
   * @param {string} label - Label text
   */
  setLabel(element, label) {
    if (!element) return;
    
    if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
      element.setAttribute('aria-label', label);
    }
  }

  /**
   * Set ARIA description on element
   * @param {Element} element - Element to describe
   * @param {string} description - Description text
   */
  setDescription(element, description) {
    if (!element) return;
    
    const descId = element.id ? `${element.id}-desc` : `desc-${Date.now()}`;
    let descElement = document.getElementById(descId);
    
    if (!descElement) {
      descElement = document.createElement('div');
      descElement.id = descId;
      descElement.className = 'sr-only';
      descElement.style.cssText = 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;';
      document.body.appendChild(descElement);
    }
    
    descElement.textContent = description;
    element.setAttribute('aria-describedby', descId);
  }

  /**
   * Set ARIA state
   * @param {Element} element - Element
   * @param {string} state - State name (e.g., 'disabled', 'expanded', 'selected')
   * @param {boolean|string} value - State value
   */
  setState(element, state, value) {
    if (!element) return;
    
    if (typeof value === 'boolean') {
      element.setAttribute(`aria-${state}`, value.toString());
    } else {
      element.setAttribute(`aria-${state}`, value);
    }
  }

  /**
   * Save current focus for restoration
   */
  saveFocus() {
    this.focusHistory.push(document.activeElement);
    
    // Limit history size
    if (this.focusHistory.length > 10) {
      this.focusHistory.shift();
    }
  }

  /**
   * Restore previous focus
   * @returns {boolean} True if focus was restored
   */
  restoreFocus() {
    if (this.focusHistory.length > 0) {
      const previous = this.focusHistory.pop();
      if (previous && document.contains(previous)) {
        previous.focus();
        return true;
      }
    }
    return false;
  }

  /**
   * Trap focus within an element (for modals)
   * @param {Element} container - Container element
   * @param {Element} firstFocus - First focusable element (optional)
   * @param {Element} lastFocus - Last focusable element (optional)
   */
  trapFocus(container, firstFocus = null, lastFocus = null) {
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const first = firstFocus || focusableElements[0];
    const last = lastFocus || focusableElements[focusableElements.length - 1];

    const handleTab = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        // Tab
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTab);
    
    // Focus first element
    if (first) {
      first.focus();
    }

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTab);
    };
  }

  /**
   * Setup skip links for keyboard navigation
   */
  setupSkipLinks() {
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-link sr-only';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = 'position: absolute; top: -40px; left: 0; background: #000; color: #fff; padding: 8px; z-index: 10000; text-decoration: none;';
    skipLink.addEventListener('focus', function() {
      this.style.top = '0';
    });
    skipLink.addEventListener('blur', function() {
      this.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    this.skipLinks.push(skipLink);
  }

  /**
   * Setup keyboard shortcuts
   */
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Alt + S: Skip to main content
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        const main = document.querySelector('main');
        if (main) {
          main.focus();
          main.scrollIntoView();
        }
      }
    });
  }

  /**
   * Update button ARIA label based on state
   * @param {Element} button - Button element
   * @param {string} action - Action name
   * @param {Object} context - Context information
   */
  updateButtonLabel(button, action, context = {}) {
    if (!button) return;

    const labels = {
      'pause': 'Pause game',
      'resume': 'Resume game',
      'new-game': 'Start new game',
      'hint': `Get hint (${context.hintsRemaining || 0} remaining)`,
      'statistics': 'View game statistics',
      'settings': 'Open settings',
      'help': 'Open help and tutorial',
      'quit': 'Quit current game'
    };

    const label = labels[action] || action;
    this.setLabel(button, label);
  }

  /**
   * Update progress bar ARIA attributes
   * @param {Element} progressBar - Progress bar element
   * @param {number} value - Current value (0-100)
   * @param {string} label - Optional label
   */
  updateProgressBar(progressBar, value, label = 'Game progress') {
    if (!progressBar) return;

    progressBar.setAttribute('role', 'progressbar');
    progressBar.setAttribute('aria-valuenow', value);
    progressBar.setAttribute('aria-valuemin', 0);
    progressBar.setAttribute('aria-valuemax', 100);
    progressBar.setAttribute('aria-label', label);
  }

  /**
   * Make element focusable
   * @param {Element} element - Element to make focusable
   * @param {number} tabIndex - Tab index (default: 0)
   */
  makeFocusable(element, tabIndex = 0) {
    if (!element) return;
    element.setAttribute('tabindex', tabIndex);
  }

  /**
   * Make element not focusable
   * @param {Element} element - Element to remove from tab order
   */
  makeUnfocusable(element) {
    if (!element) return;
    element.setAttribute('tabindex', '-1');
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
   * Announce letter guess result
   * @param {string} letter - Guessed letter
   * @param {boolean} correct - Whether guess was correct
   * @param {Object} context - Additional context
   */
  announceGuess(letter, correct, context = {}) {
    if (correct) {
      this.announce(`Correct! The letter ${letter} is in the word. ${context.revealed || ''}`, 'polite');
    } else {
      const remaining = context.remainingGuesses !== undefined 
        ? `${context.remainingGuesses} guesses remaining`
        : '';
      this.announce(`Incorrect. The letter ${letter} is not in the word. ${remaining}`, 'polite');
    }
  }

  /**
   * Setup ARIA for virtual keyboard
   * @param {Element} keyboard - Keyboard container
   */
  setupKeyboardARIA(keyboard) {
    if (!keyboard) return;

    keyboard.setAttribute('role', 'group');
    keyboard.setAttribute('aria-label', 'Virtual keyboard');
    
    const rows = keyboard.querySelectorAll('.keyboard-row');
    rows.forEach((row, index) => {
      row.setAttribute('role', 'group');
      row.setAttribute('aria-label', `Keyboard row ${index + 1}`);
    });

    const keys = keyboard.querySelectorAll('.keyboard-key');
    keys.forEach((key) => {
      const letter = key.textContent.trim();
      key.setAttribute('role', 'button');
      key.setAttribute('aria-label', `Guess letter ${letter}`);
      key.setAttribute('tabindex', '0');
    });
  }

  /**
   * Update keyboard key ARIA state
   * @param {Element} key - Key element
   * @param {string} state - State: 'guessed', 'correct', 'incorrect', 'disabled'
   */
  updateKeyState(key, state) {
    if (!key) return;

    const letter = key.textContent.trim();
    
    switch (state) {
      case 'guessed':
        this.setState(key, 'disabled', true);
        this.setLabel(key, `Letter ${letter} already guessed`);
        this.makeUnfocusable(key);
        break;
      case 'correct':
        this.setState(key, 'pressed', true);
        this.setLabel(key, `Letter ${letter} - correct guess`);
        break;
      case 'incorrect':
        this.setState(key, 'pressed', true);
        this.setLabel(key, `Letter ${letter} - incorrect guess`);
        break;
      case 'disabled':
        this.setState(key, 'disabled', true);
        this.makeUnfocusable(key);
        break;
    }
  }

  /**
   * Setup modal ARIA attributes
   * @param {Element} modal - Modal element
   * @param {string} title - Modal title
   * @param {boolean} isDialog - Whether it's a dialog (default: true)
   */
  setupModalARIA(modal, title, isDialog = true) {
    if (!modal) return;

    if (isDialog) {
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
    }
    
    modal.setAttribute('aria-label', title);
    
    // Find title element and link it
    const titleElement = modal.querySelector('h2, h3, [role="heading"]');
    if (titleElement) {
      const titleId = titleElement.id || `modal-title-${Date.now()}`;
      if (!titleElement.id) {
        titleElement.id = titleId;
      }
      modal.setAttribute('aria-labelledby', titleId);
    }

    // Find close button
    const closeButton = modal.querySelector('.btn-close, [aria-label*="close" i], [aria-label*="Close" i]');
    if (closeButton) {
      this.setLabel(closeButton, `Close ${title}`);
    }
  }

  /**
   * Setup form ARIA attributes
   * @param {Element} form - Form element
   * @param {string} name - Form name
   */
  setupFormARIA(form, name) {
    if (!form) return;

    form.setAttribute('role', 'form');
    form.setAttribute('aria-label', name);

    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach((input, index) => {
      if (!input.id) {
        input.id = `input-${name}-${index}`;
      }
      
      const label = form.querySelector(`label[for="${input.id}"]`);
      if (!label && !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
        const placeholder = input.getAttribute('placeholder');
        if (placeholder) {
          this.setLabel(input, placeholder);
        }
      }
    });
  }

  /**
   * Get accessibility summary
   * @returns {Object} Accessibility status
   */
  getStatus() {
    return {
      enabled: this.enabled,
      liveRegions: this.liveRegions.size,
      focusHistory: this.focusHistory.length,
      skipLinks: this.skipLinks.length
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AccessibilityManager;
}

