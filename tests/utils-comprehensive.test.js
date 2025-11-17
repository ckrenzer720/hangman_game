// Comprehensive tests for GameUtils - including validateHangmanInput and edge cases
const fs = require('fs');
const path = require('path');

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock navigator
global.navigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  vibrate: jest.fn(),
  maxTouchPoints: 0
};

// Mock document for DOM-related functions
global.document = {
  createElement: jest.fn((tag) => ({
    tagName: tag,
    className: '',
    textContent: '',
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    appendChild: jest.fn(),
  })),
};

// Load the utils class
const utilsScript = fs.readFileSync(path.join(__dirname, '../scripts/utils.js'), 'utf8');
eval(utilsScript);

describe('GameUtils - Comprehensive Tests', () => {
  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  describe('validateHangmanInput', () => {
    test('should accept valid lowercase letters', () => {
      const result = GameUtils.validateHangmanInput('a');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedInput).toBe('a');
    });

    test('should accept valid uppercase letters', () => {
      const result = GameUtils.validateHangmanInput('Z');
      expect(result.isValid).toBe(true);
      expect(result.sanitizedInput).toBe('z');
    });

    test('should reject numbers', () => {
      const result = GameUtils.validateHangmanInput('1');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Numbers are not allowed');
    });

    test('should reject special characters', () => {
      const result = GameUtils.validateHangmanInput('!');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('Special characters');
    });

    test('should reject multiple characters', () => {
      const result = GameUtils.validateHangmanInput('ab');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('one letter at a time');
    });

    test('should reject empty input', () => {
      const result = GameUtils.validateHangmanInput('');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain('enter a letter');
    });

    test('should reject null input', () => {
      const result = GameUtils.validateHangmanInput(null);
      expect(result.isValid).toBe(false);
    });

    test('should reject undefined input', () => {
      const result = GameUtils.validateHangmanInput(undefined);
      expect(result.isValid).toBe(false);
    });

    test('should handle accented characters', () => {
      // Accented characters should be normalized
      const result = GameUtils.validateHangmanInput('é');
      // The result depends on normalizeLetter implementation
      expect(result).toBeDefined();
    });

    test('should preserve original input in result', () => {
      const result = GameUtils.validateHangmanInput('A');
      expect(result.originalInput).toBe('A');
    });
  });

  describe('containsOnlyValidCharacters', () => {
    test('should accept valid word', () => {
      expect(GameUtils.containsOnlyValidCharacters('hello')).toBe(true);
    });

    test('should accept word with spaces', () => {
      expect(GameUtils.containsOnlyValidCharacters('hello world')).toBe(true);
    });

    test('should reject word with numbers', () => {
      expect(GameUtils.containsOnlyValidCharacters('hello123')).toBe(false);
    });

    test('should reject word with special characters', () => {
      expect(GameUtils.containsOnlyValidCharacters('hello!')).toBe(false);
    });

    test('should reject null input', () => {
      expect(GameUtils.containsOnlyValidCharacters(null)).toBe(false);
    });

    test('should reject non-string input', () => {
      expect(GameUtils.containsOnlyValidCharacters(123)).toBe(false);
    });
  });

  describe('getInputErrorMessage', () => {
    test('should return message for numbers', () => {
      const message = GameUtils.getInputErrorMessage('1');
      expect(message).toContain('Numbers are not allowed');
    });

    test('should return message for special characters', () => {
      const message = GameUtils.getInputErrorMessage('!');
      expect(message).toContain('Special characters');
    });

    test('should return message for multiple characters', () => {
      const message = GameUtils.getInputErrorMessage('ab');
      expect(message).toContain('one letter at a time');
    });

    test('should return message for empty input', () => {
      const message = GameUtils.getInputErrorMessage('');
      expect(message).toContain('enter a letter');
    });
  });

  describe('Edge Cases - Array Utilities', () => {
    test('should handle empty array in shuffle', () => {
      const result = GameUtils.shuffleArray([]);
      expect(result).toEqual([]);
    });

    test('should handle single element array', () => {
      const result = GameUtils.shuffleArray([1]);
      expect(result).toEqual([1]);
    });

    test('should handle null in getRandomElement', () => {
      const result = GameUtils.getRandomElement(null);
      expect(result).toBeUndefined();
    });
  });

  describe('Edge Cases - Time Formatting', () => {
    test('should handle negative time', () => {
      const result = GameUtils.formatTime(-10);
      expect(result).toBeDefined();
    });

    test('should handle very large time', () => {
      const result = GameUtils.formatTime(999999);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should handle decimal time', () => {
      const result = GameUtils.formatTime(30.5);
      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases - Local Storage', () => {
    test('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      
      const result = GameUtils.saveToLocalStorage('key', { data: 'test' });
      expect(result).toBe(false);
    });

    test('should handle invalid JSON in localStorage', () => {
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      const result = GameUtils.loadFromLocalStorage('key', 'default');
      expect(result).toBe('default');
    });

    test('should handle null localStorage value', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = GameUtils.loadFromLocalStorage('key', 'default');
      expect(result).toBe('default');
    });
  });

  describe('Edge Cases - Input Sanitization', () => {
    test('should handle whitespace-only input', () => {
      const result = GameUtils.sanitizeInput('   ');
      expect(result).toBe('');
    });

    test('should handle mixed case input', () => {
      const result = GameUtils.sanitizeInput('  HeLLo  ');
      expect(result).toBe('hello');
    });

    test('should handle numeric input', () => {
      const result = GameUtils.sanitizeInput(123);
      expect(result).toBe('123');
    });

    test('should handle special characters in sanitize', () => {
      const result = GameUtils.sanitizeInput('  !@#  ');
      expect(result).toBe('!@#');
    });
  });

  describe('Edge Cases - Device Detection', () => {
    test('should handle missing userAgent', () => {
      delete global.navigator.userAgent;
      const result = GameUtils.isMobile();
      expect(typeof result).toBe('boolean');
    });

    test('should handle missing maxTouchPoints', () => {
      delete global.navigator.maxTouchPoints;
      const result = GameUtils.isTouchDevice();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Edge Cases - Debounce and Throttle', () => {
    test('should handle rapid calls', (done) => {
      let callCount = 0;
      const debouncedFn = GameUtils.debounce(() => {
        callCount++;
      }, 10);

      // Call 100 times rapidly
      for (let i = 0; i < 100; i++) {
        debouncedFn();
      }

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 50);
    });

    test('should handle zero delay', (done) => {
      let callCount = 0;
      const debouncedFn = GameUtils.debounce(() => {
        callCount++;
      }, 0);

      debouncedFn();
      
      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 10);
    });
  });
});

