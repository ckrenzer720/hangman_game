// Performance integration tests
const fs = require('fs');
const path = require('path');

// Mock fetch
global.fetch = jest.fn();

// Load scripts
const utilsScript = fs.readFileSync(path.join(__dirname, '../scripts/utils.js'), 'utf8');
eval(utilsScript);

const gameScript = fs.readFileSync(path.join(__dirname, '../scripts/game.js'), 'utf8');
eval(gameScript);

describe('Performance Integration Tests', () => {
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

  describe('Game Initialization Performance', () => {
    test('should initialize game quickly', () => {
      const startTime = Date.now();
      const newGame = new HangmanGame();
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should initialize in less than 100ms
      expect(duration).toBeLessThan(100);
      expect(newGame).toBeDefined();
    });

    test('should load words efficiently', async () => {
      const startTime = Date.now();
      await new Promise(resolve => setTimeout(resolve, 100));
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Word loading should be reasonably fast
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Game Logic Performance', () => {
    test('should process guesses quickly', () => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';

      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        game.makeGuess('c');
        game.gameState.guessedLetters = [];
        game.gameState.hiddenWord = '_ _ _';
      }
      const endTime = Date.now();
      const duration = endTime - startTime;

      // 100 guesses should complete in less than 100ms
      expect(duration).toBeLessThan(100);
    });

    test('should update statistics efficiently', () => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';

      const startTime = Date.now();
      for (let i = 0; i < 10; i++) {
        game.makeGuess('c');
        game.makeGuess('a');
        game.makeGuess('t');
        game.resetGame();
        game.gameState.currentWord = 'cat';
        game.gameState.hiddenWord = '_ _ _';
      }
      const endTime = Date.now();
      const duration = endTime - startTime;

      // 10 complete games should finish in reasonable time
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Memory Performance', () => {
    test('should not create memory leaks with multiple games', () => {
      const games = [];
      
      for (let i = 0; i < 50; i++) {
        const newGame = new HangmanGame();
        games.push(newGame);
      }

      // Should handle multiple game instances
      expect(games.length).toBe(50);
      expect(games[0]).toBeDefined();
    });

    test('should clean up game state on reset', () => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.guessedLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
      game.gameState.incorrectGuesses = ['z', 'x', 'w', 'v', 'u', 's'];

      game.resetGame();

      // State should be cleaned up
      expect(game.gameState.guessedLetters.length).toBe(0);
      expect(game.gameState.incorrectGuesses.length).toBe(0);
    });
  });

  describe('Input Processing Performance', () => {
    test('should validate input quickly', () => {
      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        GameUtils.validateHangmanInput('a');
      }
      const endTime = Date.now();
      const duration = endTime - startTime;

      // 1000 validations should complete in less than 50ms
      expect(duration).toBeLessThan(50);
    });

    test('should sanitize input efficiently', () => {
      const startTime = Date.now();
      for (let i = 0; i < 1000; i++) {
        GameUtils.sanitizeInput('  TEST  ');
      }
      const endTime = Date.now();
      const duration = endTime - startTime;

      // 1000 sanitizations should complete quickly
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Statistics Calculation Performance', () => {
    test('should calculate statistics quickly', () => {
      // Add many game records
      for (let i = 0; i < 100; i++) {
        game.statistics.gameHistory.push({
          id: i,
          result: i % 2 === 0 ? 'won' : 'lost',
          difficulty: 'medium',
          category: 'animals',
          playTime: 1000 + i,
          totalGuesses: 5 + i,
          correctGuesses: 3 + i,
          incorrectGuesses: 2,
          score: 100 + i,
          timestamp: new Date().toISOString(),
          word: 'test'
        });
      }

      const startTime = Date.now();
      game.updatePerformanceMetrics();
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should calculate metrics quickly even with 100 games
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Word Selection Performance', () => {
    test('should select words quickly', () => {
      game.wordLists = {
        easy: { animals: Array.from({ length: 1000 }, (_, i) => `word${i}`) },
        medium: { animals: Array.from({ length: 1000 }, (_, i) => `word${i}`) },
        hard: { animals: Array.from({ length: 1000 }, (_, i) => `word${i}`) }
      };
      game.wordsLoaded = true;

      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        game.selectRandomWord();
      }
      const endTime = Date.now();
      const duration = endTime - startTime;

      // 100 word selections should complete quickly
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Debounce and Throttle Performance', () => {
    test('should debounce efficiently', (done) => {
      let callCount = 0;
      const debouncedFn = GameUtils.debounce(() => {
        callCount++;
      }, 10);

      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        debouncedFn();
      }

      setTimeout(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        expect(callCount).toBe(1);
        expect(duration).toBeLessThan(50);
        done();
      }, 30);
    });

    test('should throttle efficiently', (done) => {
      let callCount = 0;
      const throttledFn = GameUtils.throttle(() => {
        callCount++;
      }, 10);

      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        throttledFn();
      }

      setTimeout(() => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        expect(callCount).toBeGreaterThan(0);
        expect(duration).toBeLessThan(50);
        done();
      }, 30);
    });
  });

  describe('Large Data Set Performance', () => {
    test('should handle large word lists', () => {
      const largeWordList = {
        easy: {
          animals: Array.from({ length: 10000 }, (_, i) => `word${i}`),
          colors: Array.from({ length: 10000 }, (_, i) => `word${i}`)
        }
      };

      game.wordLists = largeWordList;
      game.wordsLoaded = true;

      const startTime = Date.now();
      game.selectRandomWord();
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should select word quickly even from large list
      expect(duration).toBeLessThan(10);
    });

    test('should handle large statistics history', () => {
      game.statistics.gameHistory = Array.from({ length: 1000 }, (_, i) => ({
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
      }));

      const startTime = Date.now();
      game.updatePerformanceMetrics();
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should process large history quickly
      expect(duration).toBeLessThan(200);
    });
  });
});

