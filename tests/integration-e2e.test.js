// End-to-end integration tests for complete game flow
const fs = require('fs');
const path = require('path');

// Mock fetch
global.fetch = jest.fn();

// Load all required scripts
const utilsScript = fs.readFileSync(path.join(__dirname, '../scripts/utils.js'), 'utf8');
eval(utilsScript);

const gameScript = fs.readFileSync(path.join(__dirname, '../scripts/game.js'), 'utf8');
eval(gameScript);

// Mock DOM for UI testing (jsdom is provided by jest-environment-jsdom)
// No need to manually set up - jest handles it

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('End-to-End Game Flow Integration Tests', () => {
  let game;

  beforeEach(() => {
    // Reset localStorage
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    
    // Mock fetch for word loading
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        easy: {
          animals: ["cat", "dog", "bird"],
          colors: ["red", "blue", "green"]
        },
        medium: {
          animals: ["elephant", "giraffe", "penguin"],
          countries: ["france", "germany", "japan"]
        },
        hard: {
          animals: ["rhinoceros", "hippopotamus", "orangutan"],
          science: ["photosynthesis", "metamorphosis", "chromosome"]
        }
      })
    });

    // Create game instance
    game = new HangmanGame();
  });

  describe('Complete Game Flow - Win Scenario', () => {
    test('should complete full game flow from start to win', async () => {
      // Wait for words to load
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Set up a known word
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
      game.gameState.guessedLetters = [];
      game.gameState.incorrectGuesses = [];

      // Initial state
      expect(game.gameState.gameStatus).toBe('playing');
      expect(game.gameState.hiddenWord).toBe('_ _ _');

      // Make correct guesses
      const guess1 = game.makeGuess('c');
      expect(guess1).toBe(true);
      expect(game.gameState.hiddenWord).toContain('c');

      const guess2 = game.makeGuess('a');
      expect(guess2).toBe(true);
      expect(game.gameState.hiddenWord).toContain('a');

      const guess3 = game.makeGuess('t');
      expect(guess3).toBe(true);

      // Game should be won
      expect(game.gameState.gameStatus).toBe('won');
      expect(game.gameState.score).toBeGreaterThan(0);
      expect(game.statistics.gamesWon).toBeGreaterThan(0);
    });
  });

  describe('Complete Game Flow - Lose Scenario', () => {
    test('should complete full game flow from start to loss', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
      game.gameState.guessedLetters = [];
      game.gameState.incorrectGuesses = [];

      // Make 6 incorrect guesses
      const wrongLetters = ['z', 'x', 'w', 'v', 'u', 's'];
      wrongLetters.forEach((letter, index) => {
        const result = game.makeGuess(letter);
        expect(result).toBe(false);
        expect(game.gameState.incorrectGuesses.length).toBe(index + 1);
      });

      // Game should be lost
      expect(game.gameState.gameStatus).toBe('lost');
      expect(game.statistics.gamesLost).toBeGreaterThan(0);
    });
  });

  describe('Game Reset and New Game Flow', () => {
    test('should reset game and start new game correctly', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Complete a game
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');

      const scoreAfterWin = game.gameState.score;
      expect(game.gameState.gameStatus).toBe('won');

      // Reset game
      game.resetGame();

      // Verify reset state
      expect(game.gameState.guessedLetters).toEqual([]);
      expect(game.gameState.incorrectGuesses).toEqual([]);
      expect(game.gameState.gameStatus).toBe('playing');
      expect(game.gameState.score).toBe(scoreAfterWin); // Score preserved
    });
  });

  describe('Statistics Integration', () => {
    test('should track statistics across multiple games', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const initialPlayed = game.statistics.gamesPlayed;
      const initialWon = game.statistics.gamesWon;

      // Play and win first game
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');

      expect(game.statistics.gamesPlayed).toBe(initialPlayed + 1);
      expect(game.statistics.gamesWon).toBe(initialWon + 1);

      // Play and lose second game
      game.resetGame();
      game.gameState.currentWord = 'dog';
      game.gameState.hiddenWord = '_ _ _';
      ['z', 'x', 'w', 'v', 'u', 's'].forEach(letter => game.makeGuess(letter));

      expect(game.statistics.gamesPlayed).toBe(initialPlayed + 2);
      expect(game.statistics.gamesLost).toBeGreaterThan(initialWon);
    });
  });

  describe('Difficulty and Category Integration', () => {
    test('should handle difficulty and category changes', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Change difficulty
      game.gameState.difficulty = 'hard';
      game.gameState.category = 'science';
      
      expect(game.gameState.difficulty).toBe('hard');
      expect(game.gameState.category).toBe('science');

      // Reset should preserve settings
      game.resetGame();
      expect(game.gameState.difficulty).toBe('hard');
      expect(game.gameState.category).toBe('science');
    });
  });

  describe('Hint System Integration', () => {
    test('should integrate hint system with game flow', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';

      const initialHidden = game.gameState.hiddenWord;
      game.getHint();

      // Hint should reveal a letter
      expect(game.gameState.hiddenWord).not.toBe(initialHidden);
      expect(game.gameState.hiddenWord).toMatch(/[cat]/);
    });
  });

  describe('Pause/Resume Integration', () => {
    test('should integrate pause/resume with game flow', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';

      // Pause game
      const pauseResult = game.pauseGame();
      expect(pauseResult).toBe(true);
      expect(game.gameState.isPaused).toBe(true);

      // Should not allow guesses when paused
      const guessResult = game.makeGuess('c');
      expect(guessResult).toBe(false);

      // Resume game
      const resumeResult = game.resumeGame();
      expect(resumeResult).toBe(true);
      expect(game.gameState.isPaused).toBe(false);

      // Should allow guesses after resume
      const guessAfterResume = game.makeGuess('c');
      expect(guessAfterResume).toBe(true);
    });
  });

  describe('Scoring System Integration', () => {
    test('should integrate scoring with game completion', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
      game.gameState.difficulty = 'medium';

      const initialScore = game.gameState.score;

      // Win game
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');

      expect(game.gameState.score).toBeGreaterThan(initialScore);
      expect(game.gameState.score).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Achievement System Integration', () => {
    test('should integrate achievements with game wins', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Reset achievements
      game.achievements.firstWin.unlocked = false;
      game.statistics.gamesWon = 0;

      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';

      // Win first game
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');

      // First win achievement should be unlocked
      if (game.statistics.gamesWon >= 1) {
        expect(game.achievements.firstWin.unlocked).toBe(true);
      }
    });
  });

  describe('Multiplayer Mode Integration', () => {
    test('should integrate multiplayer mode with game flow', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      game.enableMultiplayerMode(['Player 1', 'Player 2']);
      
      expect(game.gameState.multiplayer.enabled).toBe(true);
      
      // Play a round
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
      
      const player1 = game.getCurrentPlayer();
      const initialScore = player1.score;

      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');

      // Player should have score
      expect(player1.score).toBeGreaterThan(initialScore);
      expect(player1.wins).toBe(1);
    });
  });

  describe('Practice Mode Integration', () => {
    test('should integrate practice mode with game flow', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      game.enablePracticeMode({
        endless: true,
        allowRepeats: false
      });

      expect(game.gameState.practiceMode.enabled).toBe(true);

      // Play a game in practice mode
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';

      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');

      // Practice mode should still be enabled after game
      expect(game.gameState.practiceMode.enabled).toBe(true);
    });
  });

  describe('Timed Mode Integration', () => {
    test('should integrate timed mode with game flow', async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      game.enableTimedMode(60000);
      
      expect(game.gameState.timedMode).toBe(true);
      expect(game.gameState.timeRemaining).toBe(60000);

      // Play game in timed mode
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';

      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');

      // Time bonus should be calculated
      const timeBonus = game.calculateTimeBonus();
      expect(timeBonus).toBeGreaterThanOrEqual(0);
    });
  });
});

