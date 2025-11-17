// Comprehensive tests for HangmanGame class - covering all game features
const fs = require('fs');
const path = require('path');

// Mock fetch globally
global.fetch = jest.fn();

// Load the game class
const gameScript = fs.readFileSync(path.join(__dirname, '../scripts/game.js'), 'utf8');
eval(gameScript);

describe('HangmanGame - Comprehensive Tests', () => {
  let game;

  beforeEach(() => {
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

    // Create new game instance
    game = new HangmanGame();
  });

  describe('Statistics Tracking', () => {
    beforeEach(() => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
    });

    test('should track games played', () => {
      const initialPlayed = game.statistics.gamesPlayed;
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');
      
      expect(game.statistics.gamesPlayed).toBe(initialPlayed + 1);
    });

    test('should track games won', () => {
      const initialWon = game.statistics.gamesWon;
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');
      
      expect(game.statistics.gamesWon).toBe(initialWon + 1);
    });

    test('should track games lost', () => {
      const initialLost = game.statistics.gamesLost;
      // Make 6 incorrect guesses
      ['z', 'x', 'w', 'v', 'u', 's'].forEach(letter => game.makeGuess(letter));
      
      expect(game.statistics.gamesLost).toBe(initialLost + 1);
    });

    test('should calculate win percentage', () => {
      // Win a game
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');
      
      expect(game.statistics.winPercentage).toBeGreaterThanOrEqual(0);
      expect(game.statistics.winPercentage).toBeLessThanOrEqual(100);
    });

    test('should track current streak', () => {
      // Win first game
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');
      
      const firstStreak = game.statistics.currentStreak;
      expect(firstStreak).toBeGreaterThan(0);
    });

    test('should reset streak on loss', () => {
      // Win a game
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');
      const streakAfterWin = game.statistics.currentStreak;
      
      // Start new game and lose
      game.resetGame();
      game.gameState.currentWord = 'dog';
      game.gameState.hiddenWord = '_ _ _';
      ['z', 'x', 'w', 'v', 'u', 's'].forEach(letter => game.makeGuess(letter));
      
      expect(game.statistics.currentStreak).toBe(0);
    });
  });

  describe('Scoring System', () => {
    beforeEach(() => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
    });

    test('should calculate score based on difficulty', () => {
      game.gameState.difficulty = 'easy';
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');
      
      const easyScore = game.gameState.score;
      
      game.resetGame();
      game.gameState.difficulty = 'hard';
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');
      
      const hardScore = game.gameState.score;
      
      expect(hardScore).toBeGreaterThan(easyScore);
    });

    test('should apply efficiency bonus for fewer mistakes', () => {
      // Perfect game (no mistakes)
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');
      const perfectScore = game.gameState.score;
      
      game.resetGame();
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      // Game with mistakes
      game.makeGuess('z');
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');
      const mistakeScore = game.gameState.score;
      
      expect(perfectScore).toBeGreaterThan(mistakeScore);
    });

    test('should have minimum score of 50', () => {
      game.gameState.difficulty = 'easy';
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');
      
      expect(game.gameState.score).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Difficulty Progression', () => {
    beforeEach(() => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
      game.gameState.difficulty = 'easy';
    });

    test('should advance difficulty after consecutive wins', () => {
      const initialDifficulty = game.gameState.difficulty;
      
      // Win multiple games
      for (let i = 0; i < 4; i++) {
        game.makeGuess('c');
        game.makeGuess('a');
        game.makeGuess('t');
        game.resetGame();
        game.gameState.currentWord = 'cat';
        game.gameState.hiddenWord = '_ _ _';
      }
      
      // Should have advanced to medium after 3 wins
      expect(game.gameState.difficulty).not.toBe(initialDifficulty);
    });

    test('should reset progression on loss', () => {
      // Win some games
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');
      const winsBeforeLoss = game.difficultyProgression.consecutiveWins;
      
      // Lose next game
      game.resetGame();
      game.gameState.currentWord = 'dog';
      game.gameState.hiddenWord = '_ _ _';
      ['z', 'x', 'w', 'v', 'u', 's'].forEach(letter => game.makeGuess(letter));
      
      expect(game.difficultyProgression.consecutiveWins).toBe(0);
    });
  });

  describe('Timed Mode', () => {
    beforeEach(() => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
    });

    test('should enable timed mode', () => {
      game.enableTimedMode(60000);
      
      expect(game.gameState.timedMode).toBe(true);
      expect(game.gameState.timeLimit).toBe(60000);
      expect(game.gameState.timeRemaining).toBe(60000);
    });

    test('should disable timed mode', () => {
      game.enableTimedMode(60000);
      game.disableTimedMode();
      
      expect(game.gameState.timedMode).toBe(false);
    });

    test('should calculate time bonus', () => {
      game.enableTimedMode(60000);
      game.gameState.timeRemaining = 30000; // Half time remaining
      
      const timeBonus = game.calculateTimeBonus();
      
      expect(timeBonus).toBeGreaterThan(0);
    });
  });

  describe('Practice Mode', () => {
    beforeEach(() => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
    });

    test('should enable practice mode', () => {
      game.enablePracticeMode({
        allowRepeats: false,
        endless: true,
        lockedDifficulty: 'easy'
      });
      
      expect(game.gameState.practiceMode.enabled).toBe(true);
      expect(game.gameState.practiceMode.allowRepeats).toBe(false);
      expect(game.gameState.practiceMode.endless).toBe(true);
      expect(game.gameState.difficulty).toBe('easy');
    });

    test('should apply hint penalty in practice mode', () => {
      game.enablePracticeMode({ endless: true });
      const initialMultiplier = game.gameState.practiceMode.scorePenaltyMultiplier;
      
      game.getHint();
      
      expect(game.gameState.practiceMode.scorePenaltyMultiplier).toBeLessThan(initialMultiplier);
    });

    test('should disable achievements in practice mode', () => {
      game.enablePracticeMode({ endless: true });
      const initialAchievements = { ...game.achievements };
      
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');
      
      // Achievements should not change in practice mode
      expect(game.achievements).toEqual(initialAchievements);
    });
  });

  describe('Pause/Resume', () => {
    beforeEach(() => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
    });

    test('should pause game', () => {
      const result = game.pauseGame();
      
      expect(result).toBe(true);
      expect(game.gameState.isPaused).toBe(true);
      expect(game.gameState.gameStatus).toBe('paused');
    });

    test('should resume game', () => {
      game.pauseGame();
      const result = game.resumeGame();
      
      expect(result).toBe(true);
      expect(game.gameState.isPaused).toBe(false);
      expect(game.gameState.gameStatus).toBe('playing');
    });

    test('should not allow guesses when paused', () => {
      game.pauseGame();
      const result = game.makeGuess('c');
      
      expect(result).toBe(false);
    });
  });

  describe('Hint System', () => {
    beforeEach(() => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
    });

    test('should reveal a random letter', () => {
      const initialHidden = game.gameState.hiddenWord;
      game.getHint();
      
      expect(game.gameState.hiddenWord).not.toBe(initialHidden);
      expect(game.gameState.hiddenWord).toMatch(/[cat]/);
    });

    test('should not work when game is paused', () => {
      game.pauseGame();
      const initialHidden = game.gameState.hiddenWord;
      game.getHint();
      
      expect(game.gameState.hiddenWord).toBe(initialHidden);
    });
  });

  describe('Multiplayer Mode', () => {
    beforeEach(() => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
    });

    test('should enable multiplayer mode', () => {
      game.enableMultiplayerMode(['Player 1', 'Player 2']);
      
      expect(game.gameState.multiplayer.enabled).toBe(true);
      expect(game.gameState.multiplayer.players).toHaveLength(2);
      expect(game.gameState.multiplayer.currentPlayerIndex).toBe(0);
    });

    test('should track scores per player', () => {
      game.enableMultiplayerMode(['Player 1', 'Player 2']);
      const player1 = game.getCurrentPlayer();
      
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');
      
      expect(player1.score).toBeGreaterThan(0);
      expect(player1.wins).toBe(1);
    });

    test('should advance to next player', () => {
      game.enableMultiplayerMode(['Player 1', 'Player 2']);
      const initialIndex = game.gameState.multiplayer.currentPlayerIndex;
      
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');
      // Game should auto-advance after win
      
      // Manually advance for testing
      game.advanceToNextPlayer();
      
      expect(game.gameState.multiplayer.currentPlayerIndex).not.toBe(initialIndex);
    });
  });

  describe('Achievements', () => {
    beforeEach(() => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
    });

    test('should unlock first win achievement', () => {
      const initialUnlocked = game.achievements.firstWin.unlocked;
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');
      
      if (game.statistics.gamesWon >= 1) {
        expect(game.achievements.firstWin.unlocked).toBe(true);
      }
    });

    test('should unlock perfect game achievement', () => {
      // Win with no mistakes
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');
      
      if (game.gameState.incorrectGuesses.length === 0) {
        expect(game.achievements.perfectGame.unlocked).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    test('should handle words with spaces', () => {
      game.gameState.currentWord = 'hello world';
      game.gameState.hiddenWord = '_ _ _ _ _   _ _ _ _ _';
      game.gameState.gameStatus = 'playing';
      
      game.makeGuess('h');
      expect(game.gameState.hiddenWord).toContain('h');
    });

    test('should handle words with repeated letters', () => {
      game.gameState.currentWord = 'test';
      game.gameState.hiddenWord = '_ _ _ _';
      game.gameState.gameStatus = 'playing';
      
      game.makeGuess('t');
      expect(game.gameState.hiddenWord.split('t').length - 1).toBe(2);
    });

    test('should handle case-insensitive input', () => {
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
      
      const result = game.makeGuess('C');
      expect(result).toBe(true);
      expect(game.gameState.guessedLetters).toContain('c');
    });
  });
});

