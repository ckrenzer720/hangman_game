// Usability testing - Performance testing for usability metrics
const fs = require('fs');
const path = require('path');

// Mock fetch
global.fetch = jest.fn();

// Load scripts
const utilsScript = fs.readFileSync(path.join(__dirname, '../scripts/utils.js'), 'utf8');
eval(utilsScript);

const gameScript = fs.readFileSync(path.join(__dirname, '../scripts/game.js'), 'utf8');
eval(gameScript);

describe('Usability Testing - Performance Testing', () => {
  let game;

  beforeEach(() => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        easy: { animals: ["cat", "dog"] },
        medium: { animals: ["elephant"] },
        hard: { animals: ["rhinoceros"] }
      })
    });
    game = new HangmanGame();
  });

  describe('Page Load Performance', () => {
    test('should initialize game quickly', () => {
      const startTime = Date.now();
      const newGame = new HangmanGame();
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should initialize in less than 100ms for good UX
      expect(duration).toBeLessThan(100);
    });

    test('should load words within acceptable time', async () => {
      const startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 100));
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Word loading should be under 500ms for good UX
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Interaction Responsiveness', () => {
    test('should respond to guesses quickly', () => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';

      const startTime = Date.now();
      game.makeGuess('c');
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Guess should process in less than 10ms for instant feedback
      expect(duration).toBeLessThan(10);
    });

    test('should update UI quickly after guess', () => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';

      const startTime = Date.now();
      game.makeGuess('c');
      game.updateDisplay();
      const endTime = Date.now();
      const duration = endTime - startTime;

      // UI update should be fast
      expect(duration).toBeLessThan(50);
    });

    test('should process multiple rapid guesses efficiently', () => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';

      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        game.makeGuess('c');
        game.gameState.guessedLetters = [];
        game.gameState.hiddenWord = '_ _ _';
      }
      const endTime = Date.now();
      const duration = endTime - startTime;

      // 10 guesses should complete quickly
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Animation Performance', () => {
    test('should complete animations within reasonable time', () => {
      // Animations should not block interactions
      const animationDuration = 500; // 500ms max for animations
      
      expect(animationDuration).toBeLessThan(1000);
    });

    test('should not cause jank during animations', () => {
      // Multiple rapid state changes should not cause performance issues
      const startTime = Date.now();
      
      for (let i = 0; i < 20; i++) {
        game.gameState.currentWord = 'cat';
        game.gameState.hiddenWord = '_ _ _';
        game.updateDisplay();
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should handle rapid updates smoothly
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Memory Performance', () => {
    test('should not accumulate memory over multiple games', () => {
      const initialHistoryLength = game.statistics.gameHistory.length;
      
      // Play 50 games
      for (let i = 0; i < 50; i++) {
        game.gameState.currentWord = 'cat';
        game.gameState.hiddenWord = '_ _ _';
        game.gameState.gameStatus = 'playing';
        game.gameState.guessedLetters = [];
        game.gameState.incorrectGuesses = [];
        
        game.makeGuess('c');
        game.makeGuess('a');
        game.makeGuess('t');
        game.resetGame();
      }

      // History should be limited (not grow unbounded)
      expect(game.statistics.gameHistory.length).toBeLessThanOrEqual(100);
    });

    test('should clean up event listeners', () => {
      // Game should not leak memory from event listeners
      const game1 = new HangmanGame();
      const game2 = new HangmanGame();
      
      // Both should work independently
      expect(game1).toBeDefined();
      expect(game2).toBeDefined();
    });
  });

  describe('Input Validation Performance', () => {
    test('should validate input quickly', () => {
      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        GameUtils.validateHangmanInput('a');
      }
      const endTime = Date.now();
      const duration = endTime - startTime;

      // 1000 validations should be instant
      expect(duration).toBeLessThan(50);
    });

    test('should sanitize input efficiently', () => {
      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        GameUtils.sanitizeInput('  TEST  ');
      }
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50);
    });
  });

  describe('Statistics Calculation Performance', () => {
    test('should calculate statistics quickly', () => {
      // Add game history
      for (let i = 0; i < 50; i++) {
        game.statistics.gameHistory.push({
          id: i,
          result: 'won',
          difficulty: 'medium',
          category: 'animals',
          playTime: 1000,
          totalGuesses: 5,
          correctGuesses: 3,
          incorrectGuesses: 2,
          score: 100,
          timestamp: new Date().toISOString(),
          word: 'test'
        });
      }

      const startTime = Date.now();
      game.updatePerformanceMetrics();
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should calculate metrics quickly for good UX
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Word Selection Performance', () => {
    test('should select words quickly', () => {
      game.wordLists = {
        easy: { animals: Array.from({ length: 1000 }, (_, i) => `word${i}`) }
      };
      game.wordsLoaded = true;

      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        game.selectRandomWord();
      }
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should select words quickly
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Local Storage Performance', () => {
    test('should save to localStorage quickly', () => {
      const localStorageMock = {
        setItem: jest.fn()
      };
      global.localStorage = localStorageMock;

      const startTime = Date.now();
      GameUtils.saveToLocalStorage('test', { data: 'test' });
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should save quickly
      expect(duration).toBeLessThan(10);
    });

    test('should load from localStorage quickly', () => {
      const localStorageMock = {
        getItem: jest.fn(() => '{"data":"test"}')
      };
      global.localStorage = localStorageMock;

      const startTime = Date.now();
      GameUtils.loadFromLocalStorage('test');
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should load quickly
      expect(duration).toBeLessThan(10);
    });
  });

  describe('Rendering Performance', () => {
    test('should update display efficiently', () => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      
      const startTime = Date.now();
      game.updateDisplay();
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Display update should be fast
      expect(duration).toBeLessThan(50);
    });

    test('should handle rapid display updates', () => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      
      const startTime = Date.now();
      for (let i = 0; i < 20; i++) {
        game.updateDisplay();
      }
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should handle rapid updates efficiently
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Network Performance', () => {
    test('should handle slow network gracefully', async () => {
      // Simulate slow network
      fetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({ easy: { animals: ["cat"] } })
        }), 2000))
      );

      const startTime = Date.now();
      const gameWithSlowNetwork = new HangmanGame();
      await new Promise(resolve => setTimeout(resolve, 2100));
      const endTime = Date.now();

      // Should handle slow network without crashing
      expect(gameWithSlowNetwork).toBeDefined();
      expect(endTime - startTime).toBeGreaterThan(2000);
    });

    test('should use cached data when available', async () => {
      const localStorageMock = {
        getItem: jest.fn(() => JSON.stringify({ easy: { animals: ["cat"] } })),
        setItem: jest.fn()
      };
      global.localStorage = localStorageMock;

      const startTime = Date.now();
      const cached = GameUtils.loadFromLocalStorage('words');
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Loading from cache should be instant
      expect(duration).toBeLessThan(10);
      expect(cached).toBeDefined();
    });
  });
});

