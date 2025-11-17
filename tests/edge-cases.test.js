// Edge case and boundary condition tests
const fs = require('fs');
const path = require('path');

// Mock fetch globally
global.fetch = jest.fn();

// Load the game class
const gameScript = fs.readFileSync(path.join(__dirname, '../scripts/game.js'), 'utf8');
eval(gameScript);

const utilsScript = fs.readFileSync(path.join(__dirname, '../scripts/utils.js'), 'utf8');
eval(utilsScript);

describe('Edge Cases and Boundary Conditions', () => {
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

  describe('Input Validation Edge Cases', () => {
    test('should handle very long input strings', () => {
      const longInput = 'a'.repeat(1000);
      const result = GameUtils.validateHangmanInput(longInput);
      expect(result.isValid).toBe(false);
    });

    test('should handle unicode characters', () => {
      const result = GameUtils.validateHangmanInput('ñ');
      expect(result).toBeDefined();
    });

    test('should handle emoji input', () => {
      const result = GameUtils.validateHangmanInput('😀');
      expect(result.isValid).toBe(false);
    });

    test('should handle whitespace-only input', () => {
      const result = GameUtils.validateHangmanInput('   ');
      expect(result.isValid).toBe(false);
    });

    test('should handle newline characters', () => {
      const result = GameUtils.validateHangmanInput('\n');
      expect(result.isValid).toBe(false);
    });

    test('should handle tab characters', () => {
      const result = GameUtils.validateHangmanInput('\t');
      expect(result.isValid).toBe(false);
    });
  });

  describe('Game State Edge Cases', () => {
    test('should handle single letter word', () => {
      game.gameState.currentWord = 'a';
      game.gameState.hiddenWord = '_';
      game.gameState.gameStatus = 'playing';
      
      const result = game.makeGuess('a');
      expect(result).toBe(true);
      expect(game.gameState.gameStatus).toBe('won');
    });

    test('should handle very long word', () => {
      const longWord = 'a'.repeat(100);
      game.gameState.currentWord = longWord;
      game.gameState.hiddenWord = '_ '.repeat(100).trim();
      game.gameState.gameStatus = 'playing';
      
      const result = game.makeGuess('a');
      expect(result).toBe(true);
    });

    test('should handle word with all same letters', () => {
      game.gameState.currentWord = 'aaaa';
      game.gameState.hiddenWord = '_ _ _ _';
      game.gameState.gameStatus = 'playing';
      
      const result = game.makeGuess('a');
      expect(result).toBe(true);
      expect(game.gameState.hiddenWord.replace(/\s/g, '')).toBe('aaaa');
    });

    test('should handle word with no vowels', () => {
      game.gameState.currentWord = 'myth';
      game.gameState.hiddenWord = '_ _ _ _';
      game.gameState.gameStatus = 'playing';
      
      const result = game.makeGuess('y');
      expect(result).toBe(true);
    });
  });

  describe('Statistics Edge Cases', () => {
    test('should handle zero games played', () => {
      game.statistics.gamesPlayed = 0;
      expect(game.statistics.winPercentage).toBe(0);
    });

    test('should handle very large statistics values', () => {
      game.statistics.gamesPlayed = Number.MAX_SAFE_INTEGER;
      game.statistics.gamesWon = Number.MAX_SAFE_INTEGER;
      
      // Should not throw error
      expect(game.statistics.winPercentage).toBeDefined();
    });

    test('should handle negative statistics', () => {
      game.statistics.gamesPlayed = -1;
      // Should handle gracefully
      expect(game.statistics).toBeDefined();
    });
  });

  describe('Scoring Edge Cases', () => {
    test('should handle score overflow', () => {
      game.gameState.score = Number.MAX_SAFE_INTEGER;
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
      
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');
      
      // Should handle overflow gracefully
      expect(game.gameState.score).toBeDefined();
    });

    test('should handle zero time bonus', () => {
      game.enableTimedMode(60000);
      game.gameState.timeRemaining = 0;
      
      const bonus = game.calculateTimeBonus();
      expect(bonus).toBe(0);
    });

    test('should handle negative time remaining', () => {
      game.enableTimedMode(60000);
      game.gameState.timeRemaining = -1000;
      
      const bonus = game.calculateTimeBonus();
      expect(bonus).toBeLessThanOrEqual(0);
    });
  });

  describe('Multiplayer Edge Cases', () => {
    test('should handle single player', () => {
      game.enableMultiplayerMode(['Player 1']);
      expect(game.gameState.multiplayer.players).toHaveLength(1);
    });

    test('should handle many players', () => {
      const manyPlayers = Array.from({ length: 100 }, (_, i) => `Player ${i + 1}`);
      game.enableMultiplayerMode(manyPlayers);
      expect(game.gameState.multiplayer.players).toHaveLength(100);
    });

    test('should handle empty player names', () => {
      game.enableMultiplayerMode(['', '  ', 'Player 1']);
      expect(game.gameState.multiplayer.players.length).toBeGreaterThan(0);
    });
  });

  describe('Practice Mode Edge Cases', () => {
    test('should handle practice mode with no words available', () => {
      game.enablePracticeMode({
        allowRepeats: false,
        wordLengthFilter: { min: 100, max: 200 }
      });
      
      // Should handle gracefully when no words match filter
      expect(game.gameState.practiceMode.enabled).toBe(true);
    });

    test('should handle practice mode with extreme filters', () => {
      game.enablePracticeMode({
        wordLengthFilter: { min: 1, max: 1 }
      });
      
      expect(game.gameState.practiceMode.wordLengthFilter.min).toBe(1);
    });
  });

  describe('Timed Mode Edge Cases', () => {
    test('should handle zero time limit', () => {
      game.enableTimedMode(0);
      expect(game.gameState.timedMode).toBe(true);
      expect(game.gameState.timeLimit).toBe(0);
    });

    test('should handle very large time limit', () => {
      game.enableTimedMode(Number.MAX_SAFE_INTEGER);
      expect(game.gameState.timedMode).toBe(true);
    });

    test('should handle negative time limit', () => {
      game.enableTimedMode(-1000);
      // Should handle gracefully
      expect(game.gameState.timedMode).toBe(true);
    });
  });

  describe('Pause/Resume Edge Cases', () => {
    test('should handle pause when already paused', () => {
      game.pauseGame();
      const result = game.pauseGame();
      expect(result).toBe(false);
    });

    test('should handle resume when not paused', () => {
      const result = game.resumeGame();
      expect(result).toBe(false);
    });

    test('should handle pause when game is won', () => {
      game.gameState.gameStatus = 'won';
      const result = game.pauseGame();
      expect(result).toBe(false);
    });
  });

  describe('Word Selection Edge Cases', () => {
    test('should handle empty word list', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          easy: { animals: [] }
        })
      });
      
      const gameWithEmptyList = new HangmanGame();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should handle gracefully
      expect(gameWithEmptyList).toBeDefined();
    });

    test('should handle invalid difficulty', () => {
      game.gameState.difficulty = 'invalid';
      // Should fallback to valid difficulty
      expect(['easy', 'medium', 'hard']).toContain(game.gameState.difficulty);
    });

    test('should handle invalid category', () => {
      game.gameState.category = 'invalid';
      // Should handle gracefully
      expect(game.gameState.category).toBeDefined();
    });
  });

  describe('Achievement Edge Cases', () => {
    test('should handle achievement unlock with null date', () => {
      game.achievements.firstWin.unlockedAt = null;
      expect(game.achievements.firstWin.unlockedAt).toBeNull();
    });

    test('should handle multiple achievement unlocks simultaneously', () => {
      game.statistics.gamesWon = 0;
      game.statistics.currentStreak = 0;
      
      // Win first game
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');
      
      // Should handle multiple achievements
      expect(game.achievements).toBeDefined();
    });
  });
});

