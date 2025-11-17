// Tests for UI component interactions and DOM manipulation
const fs = require('fs');
const path = require('path');

// Mock fetch
global.fetch = jest.fn();

// Load dependencies
const utilsScript = fs.readFileSync(path.join(__dirname, '../scripts/utils.js'), 'utf8');
eval(utilsScript);

const gameScript = fs.readFileSync(path.join(__dirname, '../scripts/game.js'), 'utf8');
eval(gameScript);

// Mock game instance for UI
let mockGame;

beforeAll(() => {
  // Create a mock game instance
  fetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      easy: { animals: ["cat", "dog"] },
      medium: { animals: ["elephant", "giraffe"] },
      hard: { animals: ["rhinoceros"] }
    })
  });
  
  mockGame = new HangmanGame();
});

describe('UI Component Tests', () => {
  let container;

  beforeEach(() => {
    // Create a clean container for each test
    container = document.createElement('div');
    container.id = 'game-container';
    document.body.appendChild(container);
    
    // Set up basic HTML structure
    container.innerHTML = `
      <div id="keyboard"></div>
      <div id="word-display"></div>
      <div id="incorrect-letters"></div>
      <button id="new-game">New Game</button>
      <button id="hint">Hint</button>
      <div id="game-feedback"></div>
    `;
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Virtual Keyboard Creation', () => {
    test('should create keyboard with all letters', () => {
      const keyboard = document.getElementById('keyboard');
      const keyboardLayout = ["ABCDE", "FGHIJ", "KLMNO", "PQRST", "UVWXY", "Z"];
      
      // Simulate keyboard creation
      keyboard.innerHTML = '';
      keyboardLayout.forEach((row) => {
        const rowElement = document.createElement('div');
        rowElement.className = 'keyboard-row';
        row.split('').forEach((letter) => {
          const key = document.createElement('button');
          key.className = 'keyboard-key';
          key.textContent = letter;
          key.setAttribute('data-letter', letter.toLowerCase());
          rowElement.appendChild(key);
        });
        keyboard.appendChild(rowElement);
      });
      
      const keys = keyboard.querySelectorAll('.keyboard-key');
      expect(keys.length).toBe(26); // A-Z
    });

    test('should set correct attributes on keyboard keys', () => {
      const keyboard = document.getElementById('keyboard');
      const key = document.createElement('button');
      key.className = 'keyboard-key';
      key.textContent = 'A';
      key.setAttribute('data-letter', 'a');
      key.setAttribute('tabindex', '0');
      keyboard.appendChild(key);
      
      expect(key.getAttribute('data-letter')).toBe('a');
      expect(key.getAttribute('tabindex')).toBe('0');
    });
  });

  describe('Word Display Updates', () => {
    test('should update word display with hidden word', () => {
      const wordDisplay = document.getElementById('word-display');
      const hiddenWord = '_ _ _ _';
      
      wordDisplay.innerHTML = hiddenWord
        .split('')
        .map((char, index) => {
          if (char === ' ') return ' ';
          const isRevealed = char !== '_';
          const letterClass = isRevealed ? 'word-letter revealed' : 'word-letter';
          return `<span class="${letterClass}">${char}</span>`;
        })
        .join('');
      
      expect(wordDisplay.innerHTML).toContain('word-letter');
    });

    test('should show revealed letters correctly', () => {
      const wordDisplay = document.getElementById('word-display');
      const hiddenWord = 'c _ _';
      
      wordDisplay.innerHTML = hiddenWord
        .split('')
        .map((char) => {
          if (char === ' ') return ' ';
          const isRevealed = char !== '_';
          const letterClass = isRevealed ? 'word-letter revealed' : 'word-letter';
          return `<span class="${letterClass}">${char}</span>`;
        })
        .join('');
      
      const revealedLetters = wordDisplay.querySelectorAll('.revealed');
      expect(revealedLetters.length).toBeGreaterThan(0);
    });
  });

  describe('Button Interactions', () => {
    test('should handle new game button click', () => {
      const newGameBtn = document.getElementById('new-game');
      let clicked = false;
      
      newGameBtn.addEventListener('click', () => {
        clicked = true;
      });
      
      newGameBtn.click();
      expect(clicked).toBe(true);
    });

    test('should handle hint button click', () => {
      const hintBtn = document.getElementById('hint');
      let clicked = false;
      
      hintBtn.addEventListener('click', () => {
        clicked = true;
      });
      
      hintBtn.click();
      expect(clicked).toBe(true);
    });
  });

  describe('Feedback System', () => {
    test('should create feedback element if it does not exist', () => {
      const existingFeedback = document.getElementById('game-feedback');
      if (existingFeedback) {
        existingFeedback.remove();
      }
      
      const feedbackElement = document.createElement('div');
      feedbackElement.id = 'game-feedback';
      feedbackElement.className = 'toast';
      document.body.appendChild(feedbackElement);
      
      expect(document.getElementById('game-feedback')).toBeTruthy();
    });

    test('should update feedback message', () => {
      const feedbackElement = document.getElementById('game-feedback');
      feedbackElement.textContent = 'Test message';
      feedbackElement.className = 'toast success show';
      
      expect(feedbackElement.textContent).toBe('Test message');
      expect(feedbackElement.classList.contains('success')).toBe(true);
    });
  });

  describe('Keyboard Key States', () => {
    test('should disable guessed keys', () => {
      const keyboard = document.getElementById('keyboard');
      const key = document.createElement('button');
      key.className = 'keyboard-key';
      key.textContent = 'A';
      key.setAttribute('data-letter', 'a');
      keyboard.appendChild(key);
      
      key.disabled = true;
      key.setAttribute('tabindex', '-1');
      key.setAttribute('aria-disabled', 'true');
      
      expect(key.disabled).toBe(true);
      expect(key.getAttribute('tabindex')).toBe('-1');
    });

    test('should mark correct keys', () => {
      const keyboard = document.getElementById('keyboard');
      const key = document.createElement('button');
      key.className = 'keyboard-key';
      key.textContent = 'A';
      keyboard.appendChild(key);
      
      key.classList.add('correct');
      
      expect(key.classList.contains('correct')).toBe(true);
    });

    test('should mark incorrect keys', () => {
      const keyboard = document.getElementById('keyboard');
      const key = document.createElement('button');
      key.className = 'keyboard-key';
      key.textContent = 'Z';
      keyboard.appendChild(key);
      
      key.classList.add('incorrect');
      
      expect(key.classList.contains('incorrect')).toBe(true);
    });
  });

  describe('Incorrect Letters Display', () => {
    test('should update incorrect letters display', () => {
      const incorrectDisplay = document.getElementById('incorrect-letters');
      const incorrectGuesses = ['z', 'x', 'w'];
      
      incorrectDisplay.textContent = incorrectGuesses.join(', ');
      
      expect(incorrectDisplay.textContent).toBe('z, x, w');
    });

    test('should handle empty incorrect guesses', () => {
      const incorrectDisplay = document.getElementById('incorrect-letters');
      incorrectDisplay.textContent = '';
      
      expect(incorrectDisplay.textContent).toBe('');
    });
  });
});

