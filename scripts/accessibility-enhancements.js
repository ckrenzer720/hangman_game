// ========================================
// ACCESSIBILITY ENHANCEMENTS - HANGMAN GAME
// ========================================

/**
 * Additional accessibility enhancements beyond the base AccessibilityManager
 */
class AccessibilityEnhancements {
  constructor(accessibilityManager) {
    this.accessibilityManager = accessibilityManager;
    this.settings = {
      focusMode: 'auto', // 'auto' or 'always'
      dyslexiaFont: false,
      highContrast: false,
      announceErrors: true,
      announceLoading: true
    };
    this.init();
  }

  init() {
    this.loadSettings();
    this.setupFocusMode();
    this.setupDyslexiaFont();
    this.setupErrorAnnouncements();
    this.setupLoadingAnnouncements();
    this.setupKeyboardShortcutsHelp();
    this.enhanceFormLabels();
    this.improveColorContrast();
  }

  /**
   * Load accessibility settings from localStorage
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem('accessibility-settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Failed to load accessibility settings:', e);
    }
  }

  /**
   * Save accessibility settings to localStorage
   */
  saveSettings() {
    try {
      localStorage.setItem('accessibility-settings', JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save accessibility settings:', e);
    }
  }

  /**
   * Setup focus mode (auto or always visible)
   */
  setupFocusMode() {
    if (this.settings.focusMode === 'always') {
      document.documentElement.setAttribute('data-focus-mode', 'always');
    } else {
      document.documentElement.removeAttribute('data-focus-mode');
    }
  }

  /**
   * Toggle focus mode
   */
  toggleFocusMode() {
    this.settings.focusMode = this.settings.focusMode === 'always' ? 'auto' : 'always';
    this.setupFocusMode();
    this.saveSettings();
    this.announce(`Focus mode set to ${this.settings.focusMode === 'always' ? 'always visible' : 'automatic'}`);
  }

  /**
   * Setup dyslexia-friendly font option
   */
  setupDyslexiaFont() {
    if (this.settings.dyslexiaFont) {
      document.documentElement.setAttribute('data-dyslexia-font', 'true');
      // Add dyslexia-friendly font stack
      const style = document.createElement('style');
      style.id = 'dyslexia-font-style';
      style.textContent = `
        [data-dyslexia-font="true"] * {
          font-family: 'Comic Sans MS', 'OpenDyslexic', 'Arial', sans-serif !important;
          letter-spacing: 0.1em;
          word-spacing: 0.2em;
        }
      `;
      if (!document.getElementById('dyslexia-font-style')) {
        document.head.appendChild(style);
      }
    } else {
      document.documentElement.removeAttribute('data-dyslexia-font');
      const style = document.getElementById('dyslexia-font-style');
      if (style) {
        style.remove();
      }
    }
  }

  /**
   * Toggle dyslexia-friendly font
   */
  toggleDyslexiaFont() {
    this.settings.dyslexiaFont = !this.settings.dyslexiaFont;
    this.setupDyslexiaFont();
    this.saveSettings();
    this.announce(`Dyslexia-friendly font ${this.settings.dyslexiaFont ? 'enabled' : 'disabled'}`);
  }

  /**
   * Setup error announcements to screen readers
   */
  setupErrorAnnouncements() {
    // Override error handling to announce errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError.apply(console, args);
      if (this.settings.announceErrors && this.accessibilityManager) {
        const errorMessage = args.join(' ');
        if (errorMessage && !errorMessage.includes('Failed to')) {
          this.announce(`Error: ${this.simplifyErrorMessage(errorMessage)}`, 'assertive');
        }
      }
    };

    // Listen for error events
    window.addEventListener('error', (e) => {
      if (this.settings.announceErrors && this.accessibilityManager) {
        this.announce(`An error occurred. Please check the console for details.`, 'assertive');
      }
    });
  }

  /**
   * Simplify error messages for screen readers
   */
  simplifyErrorMessage(message) {
    // Remove technical details, keep user-friendly parts
    return message
      .replace(/Error:|TypeError:|ReferenceError:/g, '')
      .replace(/at .*\(.*\)/g, '')
      .replace(/\[.*\]/g, '')
      .substring(0, 100)
      .trim();
  }

  /**
   * Setup loading state announcements
   */
  setupLoadingAnnouncements() {
    // Observe loading indicators
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const target = mutation.target;
          if (target.id === 'loading-indicator' && this.settings.announceLoading) {
            const isVisible = target.style.display !== 'none';
            if (isVisible) {
              this.announce('Loading game content, please wait');
            } else {
              this.announce('Game loaded and ready to play');
            }
          }
        }
      });
    });

    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) {
      observer.observe(loadingIndicator, { attributes: true, attributeFilter: ['style'] });
    }
  }

  /**
   * Setup keyboard shortcuts help
   */
  setupKeyboardShortcutsHelp() {
    // Add keyboard shortcut to open help (Alt + H)
    document.addEventListener('keydown', (e) => {
      if (e.altKey && e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this.showKeyboardShortcutsHelp();
      }
    });
  }

  /**
   * Show keyboard shortcuts help modal
   */
  showKeyboardShortcutsHelp() {
    const shortcuts = [
      { keys: ['A', '-', 'Z'], desc: 'Guess a letter' },
      { keys: ['Enter'], desc: 'Activate focused element' },
      { keys: ['Space'], desc: 'Pause/Resume game' },
      { keys: ['H'], desc: 'Get a hint' },
      { keys: ['N'], desc: 'Start new game' },
      { keys: ['S'], desc: 'Open statistics' },
      { keys: ['?', 'or', 'F1'], desc: 'Open help' },
      { keys: ['Esc'], desc: 'Close modal' },
      { keys: ['Tab'], desc: 'Navigate between elements' },
      { keys: ['Alt', '+', 'S'], desc: 'Skip to main content' },
      { keys: ['Alt', '+', 'H'], desc: 'Show keyboard shortcuts' }
    ];

    const content = `
      <div class="keyboard-shortcuts-help">
        <h3>Keyboard Shortcuts</h3>
        <p>Use these keyboard shortcuts to navigate and play the game:</p>
        <ul class="shortcuts-list">
          ${shortcuts.map(s => `
            <li>
              <div class="shortcut-keys">
                ${s.keys.map(k => `<kbd>${k}</kbd>`).join(' ')}
              </div>
              <div class="shortcut-desc">${s.desc}</div>
            </li>
          `).join('')}
        </ul>
        <p class="shortcut-note">Press <kbd>Esc</kbd> to close this help.</p>
      </div>
    `;

    // Create or update help modal
    let modal = document.getElementById('keyboard-shortcuts-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'keyboard-shortcuts-modal';
      modal.className = 'modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'shortcuts-title');
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
          <button class="btn btn-close" aria-label="Close keyboard shortcuts help">✕</button>
        </div>
        ${content}
      </div>
    `;

    // Setup close button
    const closeBtn = modal.querySelector('.btn-close');
    closeBtn.addEventListener('click', () => this.hideKeyboardShortcutsHelp());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hideKeyboardShortcutsHelp();
      }
    });

    // Show modal
    if (window.modalManager) {
      window.modalManager.show(modal, { closePrevious: false });
    } else {
      modal.classList.add('show');
    }

    // Focus close button
    setTimeout(() => closeBtn.focus(), 100);
  }

  /**
   * Hide keyboard shortcuts help
   */
  hideKeyboardShortcutsHelp() {
    const modal = document.getElementById('keyboard-shortcuts-modal');
    if (modal) {
      if (window.modalManager) {
        window.modalManager.hide(modal);
      } else {
        modal.classList.remove('show');
      }
    }
  }

  /**
   * Enhance form labels with better descriptions
   */
  enhanceFormLabels() {
    // Find all inputs without proper labels
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      if (!input.id) {
        input.id = `input-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }

      // Check if label exists
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (!label && !input.getAttribute('aria-label') && !input.getAttribute('aria-labelledby')) {
        const placeholder = input.getAttribute('placeholder');
        if (placeholder) {
          input.setAttribute('aria-label', placeholder);
        }
      }

      // Add description if input has validation
      if (input.hasAttribute('required') && !input.getAttribute('aria-describedby')) {
        const descId = `${input.id}-desc`;
        let desc = document.getElementById(descId);
        if (!desc) {
          desc = document.createElement('div');
          desc.id = descId;
          desc.className = 'sr-only';
          desc.textContent = 'This field is required';
          input.parentNode.insertBefore(desc, input.nextSibling);
        }
        input.setAttribute('aria-describedby', descId);
      }
    });
  }

  /**
   * Improve color contrast for better visibility
   */
  improveColorContrast() {
    // Ensure buttons have sufficient contrast
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
      const bgColor = window.getComputedStyle(btn).backgroundColor;
      const textColor = window.getComputedStyle(btn).color;
      
      // Add aria-label if text contrast might be low
      if (!btn.getAttribute('aria-label') && btn.textContent.trim()) {
        btn.setAttribute('aria-label', btn.textContent.trim());
      }
    });
  }

  /**
   * Announce message using accessibility manager
   */
  announce(message, priority = 'polite') {
    if (this.accessibilityManager && typeof this.accessibilityManager.announce === 'function') {
      this.accessibilityManager.announce(message, priority);
    }
  }

  /**
   * Get accessibility settings
   */
  getSettings() {
    return { ...this.settings };
  }

  /**
   * Update setting
   */
  updateSetting(key, value) {
    if (key in this.settings) {
      this.settings[key] = value;
      this.saveSettings();
      
      // Apply setting
      switch (key) {
        case 'focusMode':
          this.setupFocusMode();
          break;
        case 'dyslexiaFont':
          this.setupDyslexiaFont();
          break;
      }
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AccessibilityEnhancements };
}

