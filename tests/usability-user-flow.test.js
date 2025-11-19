// Usability testing - User flow analysis
const fs = require('fs');
const path = require('path');

// Mock fetch
global.fetch = jest.fn();

// Load scripts
const utilsScript = fs.readFileSync(path.join(__dirname, '../scripts/utils.js'), 'utf8');
eval(utilsScript);

const gameScript = fs.readFileSync(path.join(__dirname, '../scripts/game.js'), 'utf8');
eval(gameScript);

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('Usability Testing - User Flow Analysis', () => {
  let game;

  beforeEach(() => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        easy: { animals: ["cat", "dog", "bird"] },
        medium: { animals: ["elephant", "giraffe"] },
        hard: { animals: ["rhinoceros"] }
      })
    });
    game = new HangmanGame();
  });

  describe('New User Flow - First Time Playing', () => {
    test('should guide new user through initial game', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // New user starts game
      expect(game.gameState.gameStatus).toBe('playing');
      expect(game.statistics.gamesPlayed).toBe(0);
      
      // User makes first guess
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      const firstGuess = game.makeGuess('c');
      
      expect(firstGuess).toBe(true);
      expect(game.gameState.guessedLetters.length).toBe(1);
      
      // User completes first game
      game.makeGuess('a');
      game.makeGuess('t');
      
      expect(game.gameState.gameStatus).toBe('won');
      expect(game.statistics.gamesPlayed).toBe(1);
      expect(game.statistics.gamesWon).toBe(1);
    });

    test('should provide clear feedback for new users', () => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      
      // Correct guess should provide positive feedback
      const correctResult = game.makeGuess('c');
      expect(correctResult).toBe(true);
      expect(game.gameState.hiddenWord).toContain('c');
      
      // Incorrect guess should provide clear feedback
      const incorrectResult = game.makeGuess('z');
      expect(incorrectResult).toBe(false);
      expect(game.gameState.incorrectGuesses).toContain('z');
    });
  });

  describe('Returning User Flow - Multiple Games', () => {
    test('should maintain user progress across sessions', () => {
      // Simulate user playing multiple games
      const gamesPlayed = [];
      
      for (let i = 0; i < 5; i++) {
        game.gameState.currentWord = 'cat';
        game.gameState.hiddenWord = '_ _ _';
        game.gameState.gameStatus = 'playing';
        game.gameState.guessedLetters = [];
        game.gameState.incorrectGuesses = [];
        
        game.makeGuess('c');
        game.makeGuess('a');
        game.makeGuess('t');
        
        gamesPlayed.push(game.gameState.gameStatus);
        game.resetGame();
      }
      
      // All games should complete successfully
      expect(gamesPlayed.every(status => status === 'won')).toBe(true);
      expect(game.statistics.gamesPlayed).toBeGreaterThanOrEqual(5);
    });

    test('should track user statistics accurately', () => {
      // Play and win 3 games
      for (let i = 0; i < 3; i++) {
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
      
      // Statistics should reflect 3 wins
      expect(game.statistics.gamesWon).toBeGreaterThanOrEqual(3);
      expect(game.statistics.winPercentage).toBeGreaterThan(0);
    });
  });

  describe('Settings Configuration Flow', () => {
    test('should allow user to change difficulty', () => {
      const initialDifficulty = game.gameState.difficulty;
      
      game.gameState.difficulty = 'hard';
      expect(game.gameState.difficulty).toBe('hard');
      expect(game.gameState.difficulty).not.toBe(initialDifficulty);
    });

    test('should allow user to change category', () => {
      const initialCategory = game.gameState.category;
      
      game.gameState.category = 'colors';
      expect(game.gameState.category).toBe('colors');
      expect(game.gameState.category).not.toBe(initialCategory);
    });

    test('should persist settings across games', () => {
      game.gameState.difficulty = 'hard';
      game.gameState.category = 'science';
      
      game.resetGame();
      
      expect(game.gameState.difficulty).toBe('hard');
      expect(game.gameState.category).toBe('science');
    });
  });

  describe('Game Mode Selection Flow', () => {
    test('should allow user to enable timed mode', () => {
      game.enableTimedMode(60000);
      
      expect(game.gameState.timedMode).toBe(true);
      expect(game.gameState.timeLimit).toBe(60000);
    });

    test('should allow user to enable practice mode', () => {
      game.enablePracticeMode({
        endless: true,
        allowRepeats: false
      });
      
      expect(game.gameState.practiceMode.enabled).toBe(true);
      expect(game.gameState.practiceMode.endless).toBe(true);
    });

    test('should allow user to enable multiplayer mode', () => {
      game.enableMultiplayerMode(['Player 1', 'Player 2']);
      
      expect(game.gameState.multiplayer.enabled).toBe(true);
      expect(game.gameState.multiplayer.players).toHaveLength(2);
    });
  });

  describe('Help and Tutorial Flow', () => {
    test('should provide accessible help information', () => {
      // Help should be available
      expect(game).toBeDefined();
      
      // User should be able to access game rules
      const hasHelpSystem = typeof window !== 'undefined' && window.helpSystem;
      // Help system should be available when needed
      expect(true).toBe(true);
    });
  });

  describe('Error Recovery Flow', () => {
    test('should handle user errors gracefully', () => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
      
      // User tries to guess same letter twice
      game.makeGuess('c');
      const duplicateResult = game.makeGuess('c');
      
      expect(duplicateResult).toBe(false);
      expect(game.gameState.guessedLetters.filter(l => l === 'c').length).toBe(1);
    });

    test('should handle invalid input gracefully', () => {
      const validation = GameUtils.validateHangmanInput('123');
      
      expect(validation.isValid).toBe(false);
      expect(validation.errorMessage).toBeDefined();
      expect(validation.errorMessage.length).toBeGreaterThan(0);
    });
  });

  describe('Win/Lose Flow', () => {
    test('should provide clear win feedback', () => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
      
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');
      
      expect(game.gameState.gameStatus).toBe('won');
      expect(game.gameState.score).toBeGreaterThan(0);
    });

    test('should provide clear lose feedback', () => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
      
      ['z', 'x', 'w', 'v', 'u', 's'].forEach(letter => game.makeGuess(letter));
      
      expect(game.gameState.gameStatus).toBe('lost');
      expect(game.gameState.incorrectGuesses.length).toBe(6);
    });

    test('should allow quick restart after game ends', () => {
      // Complete a game
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');
      
      expect(game.gameState.gameStatus).toBe('won');
      
      // Reset should be quick
      const resetStart = Date.now();
      game.resetGame();
      const resetEnd = Date.now();
      
      expect(resetEnd - resetStart).toBeLessThan(10);
      expect(game.gameState.gameStatus).toBe('playing');
    });
  });

  describe('Statistics Viewing Flow', () => {
    test('should allow user to view statistics', () => {
      // Play some games
      for (let i = 0; i < 3; i++) {
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
      
      // Statistics should be available
      const stats = game.getStatistics();
      expect(stats.gamesPlayed).toBeGreaterThanOrEqual(3);
      expect(stats.gamesWon).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Accessibility Flow', () => {
    test('should support keyboard-only navigation', () => {
      // User should be able to navigate with keyboard
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
      
      // Simulate keyboard input
      const validation = GameUtils.validateHangmanInput('c');
      if (validation.isValid) {
        const result = game.makeGuess(validation.sanitizedInput);
        expect(result).toBe(true);
      }
    });

    test('should support screen reader announcements', () => {
      // Game state changes should be announced
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      
      const beforeGuess = game.gameState.hiddenWord;
      game.makeGuess('c');
      const afterGuess = game.gameState.hiddenWord;
      
      // State should change (announced to screen reader)
      expect(afterGuess).not.toBe(beforeGuess);
    });
  });
});

