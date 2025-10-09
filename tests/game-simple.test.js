// Simplified tests for HangmanGame class - focusing on core logic without DOM
const fs = require('fs');
const path = require('path');

// Mock fetch globally
global.fetch = jest.fn();

// Load the game class
const gameScript = fs.readFileSync(path.join(__dirname, '../scripts/game.js'), 'utf8');
eval(gameScript);

describe('HangmanGame - Core Logic', () => {
  let game;

  beforeEach(() => {
    // Mock fetch for word loading
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        easy: {
          animals: ["cat", "dog", "bird"]
        },
        medium: {
          animals: ["elephant", "giraffe", "penguin"]
        },
        hard: {
          animals: ["rhinoceros", "hippopotamus", "orangutan"]
        }
      })
    });

    // Create new game instance
    game = new HangmanGame();
  });

  describe('Game Initialization', () => {
    test('should initialize with correct default state', () => {
      expect(game.gameState.currentWord).toBe('');
      expect(game.gameState.hiddenWord).toBe('');
      expect(game.gameState.guessedLetters).toEqual([]);
      expect(game.gameState.incorrectGuesses).toEqual([]);
      expect(game.gameState.maxIncorrectGuesses).toBe(6);
      expect(game.gameState.gameStatus).toBe('playing');
      expect(game.gameState.score).toBe(0);
      expect(game.gameState.difficulty).toBe('medium');
      expect(game.gameState.category).toBe('animals');
    });

    test('should have correct hangman parts', () => {
      expect(game.hangmanParts).toEqual([
        'beam', 'rope', 'head', 'body', 
        'left-arm', 'right-arm', 'left-leg', 'right-leg'
      ]);
    });
  });

  describe('Game Logic', () => {
    beforeEach(() => {
      // Set up a known word for testing
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';
    });

    test('should handle correct guess', () => {
      const result = game.makeGuess('c');
      
      expect(result).toBe(true);
      expect(game.gameState.guessedLetters).toContain('c');
      expect(game.gameState.hiddenWord).toContain('c');
      expect(game.gameState.incorrectGuesses).not.toContain('c');
    });

    test('should handle incorrect guess', () => {
      const result = game.makeGuess('z');
      
      expect(result).toBe(false);
      expect(game.gameState.guessedLetters).toContain('z');
      expect(game.gameState.incorrectGuesses).toContain('z');
      expect(game.gameState.hiddenWord).not.toContain('z');
    });

    test('should not allow duplicate guesses', () => {
      game.makeGuess('a');
      const result = game.makeGuess('a');
      
      expect(result).toBe(false);
      expect(game.gameState.guessedLetters.filter(letter => letter === 'a')).toHaveLength(1);
    });

    test('should detect win condition', () => {
      game.makeGuess('c');
      game.makeGuess('a');
      game.makeGuess('t');
      
      expect(game.gameState.gameStatus).toBe('won');
      expect(game.gameState.score).toBe(100);
    });

    test('should detect lose condition', () => {
      // Make 6 incorrect guesses
      game.makeGuess('z');
      game.makeGuess('x');
      game.makeGuess('w');
      game.makeGuess('v');
      game.makeGuess('u');
      game.makeGuess('s');
      
      expect(game.gameState.gameStatus).toBe('lost');
    });

    test('should not allow guesses when game is over', () => {
      game.gameState.gameStatus = 'won';
      const result = game.makeGuess('a');
      
      expect(result).toBe(false);
    });
  });

  describe('Letter Revealing', () => {
    beforeEach(() => {
      game.gameState.currentWord = 'hello';
      game.gameState.hiddenWord = '_ _ _ _ _';
    });

    test('should reveal all instances of a letter', () => {
      game.revealLetter('l');
      expect(game.gameState.hiddenWord).toBe('_ _ l l _');
    });

    test('should handle letters that appear multiple times', () => {
      game.gameState.currentWord = 'test';
      game.gameState.hiddenWord = '_ _ _ _';
      game.revealLetter('t');
      expect(game.gameState.hiddenWord).toBe('t _ _ t');
    });
  });

  describe('Game Reset', () => {
    test('should reset game state while preserving score', () => {
      game.gameState.score = 200;
      game.gameState.difficulty = 'hard';
      game.gameState.category = 'animals';
      
      game.resetGame();
      
      expect(game.gameState.score).toBe(200);
      expect(game.gameState.difficulty).toBe('hard');
      expect(game.gameState.category).toBe('animals');
      expect(game.gameState.guessedLetters).toEqual([]);
      expect(game.gameState.incorrectGuesses).toEqual([]);
      expect(game.gameState.gameStatus).toBe('playing');
    });
  });

  describe('Error Handling', () => {
    test('should handle fetch errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      const gameWithError = new HangmanGame();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(gameWithError.wordsLoaded).toBe(true);
      expect(gameWithError.wordLists).toBeDefined();
    });
  });
});
