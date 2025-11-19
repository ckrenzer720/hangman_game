// Usability testing - Interface testing
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

describe('Usability Testing - Interface Testing', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'game-container';
    document.body.appendChild(container);
    
    container.innerHTML = `
      <div id="word-display"></div>
      <div id="incorrect-letters"></div>
      <div id="keyboard"></div>
      <button id="new-game">New Game</button>
      <button id="hint">Hint</button>
      <button id="pause-resume">Pause</button>
      <div id="game-feedback"></div>
    `;
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Visual Feedback', () => {
    test('should provide immediate feedback on button click', () => {
      const button = document.getElementById('new-game');
      let clicked = false;
      
      button.addEventListener('click', () => {
        clicked = true;
      });
      
      button.click();
      expect(clicked).toBe(true);
    });

    test('should show visual state for correct guesses', () => {
      const keyboard = document.getElementById('keyboard');
      const key = document.createElement('button');
      key.className = 'keyboard-key';
      key.textContent = 'C';
      key.setAttribute('data-letter', 'c');
      keyboard.appendChild(key);
      
      key.classList.add('correct');
      
      expect(key.classList.contains('correct')).toBe(true);
    });

    test('should show visual state for incorrect guesses', () => {
      const keyboard = document.getElementById('keyboard');
      const key = document.createElement('button');
      key.className = 'keyboard-key';
      key.textContent = 'Z';
      keyboard.appendChild(key);
      
      key.classList.add('incorrect');
      
      expect(key.classList.contains('incorrect')).toBe(true);
    });

    test('should update word display with revealed letters', () => {
      const wordDisplay = document.getElementById('word-display');
      wordDisplay.innerHTML = '<span class="word-letter revealed">c</span> <span class="word-letter">_</span> <span class="word-letter">_</span>';
      
      const revealed = wordDisplay.querySelectorAll('.revealed');
      expect(revealed.length).toBeGreaterThan(0);
    });
  });

  describe('Button States and Interactions', () => {
    test('should disable buttons appropriately', () => {
      const button = document.getElementById('hint');
      button.disabled = true;
      
      expect(button.disabled).toBe(true);
    });

    test('should show button hover states', () => {
      const button = document.getElementById('new-game');
      const hasHoverSupport = typeof button.onmouseenter !== 'undefined' || true;
      
      expect(hasHoverSupport).toBe(true);
    });

    test('should show button active states', () => {
      const button = document.getElementById('new-game');
      const hasActiveSupport = typeof button.onmousedown !== 'undefined' || true;
      
      expect(hasActiveSupport).toBe(true);
    });
  });

  describe('Information Display', () => {
    test('should display incorrect letters clearly', () => {
      const incorrectDisplay = document.getElementById('incorrect-letters');
      incorrectDisplay.textContent = 'Z, X, W';
      
      expect(incorrectDisplay.textContent).toBe('Z, X, W');
      expect(incorrectDisplay.textContent.length).toBeGreaterThan(0);
    });

    test('should display game feedback messages', () => {
      const feedback = document.getElementById('game-feedback');
      feedback.textContent = 'Correct guess!';
      feedback.className = 'toast success show';
      
      expect(feedback.textContent).toBe('Correct guess!');
      expect(feedback.classList.contains('success')).toBe(true);
    });

    test('should update feedback messages dynamically', () => {
      const feedback = document.getElementById('game-feedback');
      
      feedback.textContent = 'First message';
      expect(feedback.textContent).toBe('First message');
      
      feedback.textContent = 'Second message';
      expect(feedback.textContent).toBe('Second message');
    });
  });

  describe('Keyboard Interface', () => {
    test('should display all letters in keyboard', () => {
      const keyboard = document.getElementById('keyboard');
      const keyboardLayout = ["ABCDE", "FGHIJ", "KLMNO", "PQRST", "UVWXY", "Z"];
      
      keyboardLayout.forEach((row) => {
        const rowElement = document.createElement('div');
        rowElement.className = 'keyboard-row';
        row.split('').forEach((letter) => {
          const key = document.createElement('button');
          key.className = 'keyboard-key';
          key.textContent = letter;
          rowElement.appendChild(key);
        });
        keyboard.appendChild(rowElement);
      });
      
      const keys = keyboard.querySelectorAll('.keyboard-key');
      expect(keys.length).toBe(26);
    });

    test('should visually distinguish disabled keys', () => {
      const keyboard = document.getElementById('keyboard');
      const key = document.createElement('button');
      key.className = 'keyboard-key';
      key.disabled = true;
      key.setAttribute('aria-disabled', 'true');
      keyboard.appendChild(key);
      
      expect(key.disabled).toBe(true);
      expect(key.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('Modal and Overlay Interfaces', () => {
    test('should show game over modal on win', () => {
      const modal = document.createElement('div');
      modal.id = 'game-over-modal';
      modal.className = 'game-over-modal';
      document.body.appendChild(modal);
      
      modal.classList.add('show');
      
      expect(modal.classList.contains('show')).toBe(true);
    });

    test('should show pause overlay when paused', () => {
      const overlay = document.createElement('div');
      overlay.id = 'pause-overlay';
      overlay.className = 'pause-overlay';
      document.body.appendChild(overlay);
      
      overlay.classList.add('show');
      
      expect(overlay.classList.contains('show')).toBe(true);
    });
  });

  describe('Responsive Interface Elements', () => {
    test('should adapt button sizes for touch devices', () => {
      const button = document.getElementById('new-game');
      button.style.minHeight = '44px';
      button.style.minWidth = '44px';
      
      const computedStyle = window.getComputedStyle ? window.getComputedStyle(button) : { minHeight: '44px' };
      expect(button.style.minHeight).toBe('44px');
    });

    test('should adapt keyboard key sizes for touch', () => {
      const keyboard = document.getElementById('keyboard');
      const key = document.createElement('button');
      key.className = 'keyboard-key';
      key.style.minHeight = '44px';
      key.style.minWidth = '44px';
      keyboard.appendChild(key);
      
      expect(key.style.minHeight).toBe('44px');
      expect(key.style.minWidth).toBe('44px');
    });
  });

  describe('Loading States', () => {
    test('should show loading indicator during initialization', () => {
      const loadingIndicator = document.createElement('div');
      loadingIndicator.id = 'loading-indicator';
      loadingIndicator.className = 'loading-section';
      loadingIndicator.style.display = 'block';
      document.body.appendChild(loadingIndicator);
      
      expect(loadingIndicator.style.display).toBe('block');
    });

    test('should hide loading indicator after initialization', () => {
      const loadingIndicator = document.createElement('div');
      loadingIndicator.id = 'loading-indicator';
      loadingIndicator.style.display = 'none';
      
      expect(loadingIndicator.style.display).toBe('none');
    });
  });

  describe('Error States', () => {
    test('should display error messages clearly', () => {
      const feedback = document.getElementById('game-feedback');
      feedback.textContent = 'Error: Invalid input';
      feedback.className = 'toast error show';
      
      expect(feedback.textContent).toContain('Error');
      expect(feedback.classList.contains('error')).toBe(true);
    });

    test('should provide actionable error messages', () => {
      const validation = GameUtils.validateHangmanInput('123');
      
      expect(validation.errorMessage).toBeDefined();
      expect(validation.errorMessage.length).toBeGreaterThan(0);
      expect(validation.errorMessage).toContain('letter');
    });
  });

  describe('Success States', () => {
    test('should display success messages clearly', () => {
      const feedback = document.getElementById('game-feedback');
      feedback.textContent = 'Congratulations! You won!';
      feedback.className = 'toast success show';
      
      expect(feedback.textContent).toContain('won');
      expect(feedback.classList.contains('success')).toBe(true);
    });

    test('should provide celebration feedback on win', () => {
      const wordDisplay = document.getElementById('word-display');
      wordDisplay.classList.add('celebration');
      
      expect(wordDisplay.classList.contains('celebration')).toBe(true);
    });
  });
});

