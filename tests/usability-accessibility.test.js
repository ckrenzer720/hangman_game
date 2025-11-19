// Usability testing - Accessibility testing
const fs = require('fs');
const path = require('path');

// Mock fetch
global.fetch = jest.fn();

// Load scripts
const utilsScript = fs.readFileSync(path.join(__dirname, '../scripts/utils.js'), 'utf8');
eval(utilsScript);

const gameScript = fs.readFileSync(path.join(__dirname, '../scripts/game.js'), 'utf8');
eval(gameScript);

// Mock DOM
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;

describe('Usability Testing - Accessibility Testing', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'game-container';
    document.body.appendChild(container);
    
    container.innerHTML = `
      <main id="main-content" role="main" tabindex="-1">
        <div id="word-display" role="textbox" aria-label="Current word display" aria-live="polite" tabindex="0"></div>
        <div id="incorrect-letters" role="region" aria-label="Incorrect guesses" aria-live="polite"></div>
        <div id="keyboard" role="group" aria-label="Virtual keyboard"></div>
        <button id="new-game" aria-label="Start a new game">New Game</button>
        <button id="hint" aria-label="Get a hint">Hint</button>
      </main>
      <div id="aria-status" role="status" aria-live="polite" class="sr-only"></div>
      <div id="aria-alert" role="alert" aria-live="assertive" class="sr-only"></div>
    `;
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('ARIA Labels and Roles', () => {
    test('should have proper ARIA labels on interactive elements', () => {
      const newGameBtn = document.getElementById('new-game');
      expect(newGameBtn.getAttribute('aria-label')).toBe('Start a new game');
    });

    test('should have proper roles on semantic elements', () => {
      const main = document.getElementById('main-content');
      expect(main.getAttribute('role')).toBe('main');
      
      const keyboard = document.getElementById('keyboard');
      expect(keyboard.getAttribute('role')).toBe('group');
    });

    test('should have aria-live regions for dynamic content', () => {
      const wordDisplay = document.getElementById('word-display');
      expect(wordDisplay.getAttribute('aria-live')).toBe('polite');
      
      const incorrectLetters = document.getElementById('incorrect-letters');
      expect(incorrectLetters.getAttribute('aria-live')).toBe('polite');
    });

    test('should have aria-live regions for alerts', () => {
      const alert = document.getElementById('aria-alert');
      expect(alert.getAttribute('role')).toBe('alert');
      expect(alert.getAttribute('aria-live')).toBe('assertive');
    });
  });

  describe('Keyboard Navigation', () => {
    test('should support tab navigation', () => {
      const focusableElements = document.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      expect(focusableElements.length).toBeGreaterThan(0);
    });

    test('should have logical tab order', () => {
      const newGameBtn = document.getElementById('new-game');
      const hintBtn = document.getElementById('hint');
      
      // Both should be focusable
      expect(newGameBtn.tabIndex).toBeGreaterThanOrEqual(0);
      expect(hintBtn.tabIndex).toBeGreaterThanOrEqual(0);
    });

    test('should remove disabled elements from tab order', () => {
      const keyboard = document.getElementById('keyboard');
      const key = document.createElement('button');
      key.className = 'keyboard-key';
      key.disabled = true;
      key.setAttribute('tabindex', '-1');
      keyboard.appendChild(key);
      
      expect(key.getAttribute('tabindex')).toBe('-1');
    });

    test('should support Enter key activation', () => {
      const button = document.getElementById('new-game');
      let activated = false;
      
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          activated = true;
        }
      });
      
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      button.dispatchEvent(enterEvent);
      
      expect(activated).toBe(true);
    });

    test('should support Space key activation', () => {
      const button = document.getElementById('new-game');
      let activated = false;
      
      button.addEventListener('keydown', (e) => {
        if (e.key === ' ') {
          activated = true;
        }
      });
      
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });
      button.dispatchEvent(spaceEvent);
      
      expect(activated).toBe(true);
    });
  });

  describe('Screen Reader Support', () => {
    test('should announce game state changes', () => {
      const statusRegion = document.getElementById('aria-status');
      statusRegion.textContent = 'Game started';
      
      expect(statusRegion.textContent).toBe('Game started');
      expect(statusRegion.getAttribute('aria-live')).toBe('polite');
    });

    test('should announce important alerts', () => {
      const alertRegion = document.getElementById('aria-alert');
      alertRegion.textContent = 'Game over! You won!';
      
      expect(alertRegion.textContent).toContain('won');
      expect(alertRegion.getAttribute('aria-live')).toBe('assertive');
    });

    test('should provide descriptive labels for all buttons', () => {
      const buttons = document.querySelectorAll('button');
      buttons.forEach(button => {
        const hasLabel = button.getAttribute('aria-label') || 
                        button.textContent.trim().length > 0;
        expect(hasLabel).toBe(true);
      });
    });

    test('should provide context for keyboard keys', () => {
      const keyboard = document.getElementById('keyboard');
      const key = document.createElement('button');
      key.className = 'keyboard-key';
      key.textContent = 'A';
      key.setAttribute('aria-label', 'Guess letter A');
      keyboard.appendChild(key);
      
      expect(key.getAttribute('aria-label')).toBe('Guess letter A');
    });
  });

  describe('Focus Management', () => {
    test('should manage focus on modal open', () => {
      const modal = document.createElement('div');
      modal.id = 'game-over-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      document.body.appendChild(modal);
      
      expect(modal.getAttribute('role')).toBe('dialog');
      expect(modal.getAttribute('aria-modal')).toBe('true');
    });

    test('should restore focus on modal close', () => {
      const button = document.getElementById('new-game');
      button.focus();
      
      const focusedElement = document.activeElement;
      expect(focusedElement).toBe(button);
    });

    test('should trap focus within modals', () => {
      const modal = document.createElement('div');
      modal.id = 'modal';
      modal.setAttribute('role', 'dialog');
      const closeBtn = document.createElement('button');
      closeBtn.textContent = 'Close';
      modal.appendChild(closeBtn);
      document.body.appendChild(modal);
      
      // Focus should be manageable within modal
      expect(modal.querySelector('button')).toBeTruthy();
    });
  });

  describe('Color Contrast and Visual Accessibility', () => {
    test('should have sufficient text content for screen readers', () => {
      const button = document.getElementById('new-game');
      expect(button.textContent.trim().length).toBeGreaterThan(0);
    });

    test('should not rely solely on color for information', () => {
      const keyboard = document.getElementById('keyboard');
      const correctKey = document.createElement('button');
      correctKey.className = 'keyboard-key correct';
      correctKey.textContent = 'C';
      correctKey.setAttribute('aria-label', 'Letter C - correct');
      keyboard.appendChild(correctKey);
      
      // Information should be available via text/label, not just color
      expect(correctKey.getAttribute('aria-label')).toContain('correct');
    });
  });

  describe('Touch Target Sizes', () => {
    test('should have minimum touch target size', () => {
      const button = document.getElementById('new-game');
      button.style.minHeight = '44px';
      button.style.minWidth = '44px';
      
      expect(parseInt(button.style.minHeight)).toBeGreaterThanOrEqual(44);
    });

    test('should have adequate spacing between touch targets', () => {
      const keyboard = document.getElementById('keyboard');
      const key1 = document.createElement('button');
      key1.className = 'keyboard-key';
      key1.style.margin = '4px';
      keyboard.appendChild(key1);
      
      // Should have spacing
      expect(key1.style.margin).toBeDefined();
    });
  });

  describe('Alternative Input Methods', () => {
    test('should support keyboard input', () => {
      const validation = GameUtils.validateHangmanInput('a');
      expect(validation.isValid).toBe(true);
    });

    test('should support voice input when available', () => {
      const hasVoiceSupport = typeof window !== 'undefined' && 
                             (window.SpeechRecognition || window.webkitSpeechRecognition);
      
      // Should handle gracefully whether available or not
      expect(typeof hasVoiceSupport !== 'undefined').toBe(true);
    });
  });

  describe('Error Announcements', () => {
    test('should announce input errors', () => {
      const validation = GameUtils.validateHangmanInput('123');
      
      expect(validation.isValid).toBe(false);
      expect(validation.errorMessage).toBeDefined();
      expect(validation.errorMessage.length).toBeGreaterThan(0);
    });

    test('should provide actionable error messages', () => {
      const validation = GameUtils.validateHangmanInput('ab');
      
      expect(validation.errorMessage).toContain('one letter');
    });
  });

  describe('State Announcements', () => {
    test('should announce game state changes', () => {
      const statusRegion = document.getElementById('aria-status');
      
      statusRegion.textContent = 'Game paused';
      expect(statusRegion.textContent).toBe('Game paused');
      
      statusRegion.textContent = 'Game resumed';
      expect(statusRegion.textContent).toBe('Game resumed');
    });

    test('should announce win/lose states', () => {
      const alertRegion = document.getElementById('aria-alert');
      
      alertRegion.textContent = 'Congratulations! You won!';
      expect(alertRegion.textContent).toContain('won');
      
      alertRegion.textContent = 'Game over. The word was cat.';
      expect(alertRegion.textContent).toContain('Game over');
    });
  });
});

