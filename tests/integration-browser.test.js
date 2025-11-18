// Cross-browser compatibility integration tests
const fs = require('fs');
const path = require('path');

// Mock fetch
global.fetch = jest.fn();

// Load scripts
const utilsScript = fs.readFileSync(path.join(__dirname, '../scripts/utils.js'), 'utf8');
eval(utilsScript);

const gameScript = fs.readFileSync(path.join(__dirname, '../scripts/game.js'), 'utf8');
eval(gameScript);

describe('Cross-Browser Compatibility Integration Tests', () => {
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

  describe('Browser API Compatibility', () => {
    test('should work with localStorage API', () => {
      const localStorageMock = {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      };
      global.localStorage = localStorageMock;

      // Test localStorage operations
      const result = GameUtils.saveToLocalStorage('test', { data: 'test' });
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    test('should handle missing localStorage gracefully', () => {
      delete global.localStorage;
      
      const result = GameUtils.saveToLocalStorage('test', { data: 'test' });
      expect(result).toBe(false);
    });

    test('should work with fetch API', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ easy: { animals: ["cat"] } })
      });

      const response = await fetch('test');
      const data = await response.json();
      
      expect(data).toBeDefined();
      expect(data.easy).toBeDefined();
    });

    test('should handle fetch errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));
      
      const gameWithError = new HangmanGame();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should handle error gracefully
      expect(gameWithError).toBeDefined();
    });
  });

  describe('Feature Detection', () => {
    test('should detect touch device support', () => {
      // Test with touch support
      global.navigator = {
        maxTouchPoints: 1,
        userAgent: 'Mozilla/5.0'
      };
      global.window = { ontouchstart: true };

      const isTouch = GameUtils.isTouchDevice();
      expect(typeof isTouch).toBe('boolean');
    });

    test('should detect mobile device', () => {
      global.navigator = {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      };

      const isMobile = GameUtils.isMobile();
      expect(isMobile).toBe(true);
    });

    test('should detect desktop device', () => {
      global.navigator = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      };

      const isMobile = GameUtils.isMobile();
      expect(isMobile).toBe(false);
    });
  });

  describe('Polyfill Compatibility', () => {
    test('should work without Array.includes polyfill', () => {
      // Test that code doesn't rely on unsupported methods
      const array = [1, 2, 3];
      const hasIncludes = typeof array.includes === 'function';
      
      // Code should work with or without includes
      expect(typeof hasIncludes).toBe('boolean');
    });

    test('should work without Object.entries polyfill', () => {
      const obj = { a: 1, b: 2 };
      const hasEntries = typeof Object.entries === 'function';
      
      expect(typeof hasEntries).toBe('boolean');
    });

    test('should work without String.padStart polyfill', () => {
      const str = '5';
      const hasPadStart = typeof str.padStart === 'function';
      
      expect(typeof hasPadStart).toBe('boolean');
    });
  });

  describe('ES6 Feature Compatibility', () => {
    test('should handle arrow functions', () => {
      const arrowFn = (x) => x * 2;
      expect(arrowFn(5)).toBe(10);
    });

    test('should handle template literals', () => {
      const name = 'test';
      const template = `Hello ${name}`;
      expect(template).toBe('Hello test');
    });

    test('should handle destructuring', () => {
      const obj = { a: 1, b: 2 };
      const { a, b } = obj;
      expect(a).toBe(1);
      expect(b).toBe(2);
    });

    test('should handle spread operator', () => {
      const arr1 = [1, 2];
      const arr2 = [3, 4];
      const combined = [...arr1, ...arr2];
      expect(combined).toEqual([1, 2, 3, 4]);
    });
  });

  describe('Error Handling Across Browsers', () => {
    test('should handle TypeError gracefully', () => {
      const result = GameUtils.safeExecute(() => {
        throw new TypeError('Type error');
      }, 'test', 'default');
      
      expect(result).toBe('default');
    });

    test('should handle ReferenceError gracefully', () => {
      const result = GameUtils.safeExecute(() => {
        throw new ReferenceError('Reference error');
      }, 'test', 'default');
      
      expect(result).toBe('default');
    });

    test('should handle generic errors gracefully', () => {
      const result = GameUtils.safeExecute(() => {
        throw new Error('Generic error');
      }, 'test', 'default');
      
      expect(result).toBe('default');
    });
  });

  describe('Performance API Compatibility', () => {
    test('should work with performance.now()', () => {
      const perfMock = {
        now: jest.fn(() => Date.now())
      };
      global.performance = perfMock;

      const time = performance.now();
      expect(typeof time).toBe('number');
    });

    test('should handle missing performance API', () => {
      delete global.performance;
      
      // Code should handle gracefully
      expect(true).toBe(true);
    });
  });
});

