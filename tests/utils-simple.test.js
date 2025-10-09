// Simplified tests for GameUtils class - focusing on core functionality
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

// Load the utils class
const utilsScript = fs.readFileSync(path.join(__dirname, '../scripts/utils.js'), 'utf8');
eval(utilsScript);

describe('GameUtils - Core Functions', () => {
  beforeEach(() => {
    // Reset localStorage mock
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  describe('ID Generation', () => {
    test('should generate unique IDs', () => {
      const id1 = GameUtils.generateId();
      const id2 = GameUtils.generateId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBe(9);
    });
  });

  describe('Array Utilities', () => {
    test('should shuffle array', () => {
      const originalArray = [1, 2, 3, 4, 5];
      const shuffled = GameUtils.shuffleArray(originalArray);
      
      expect(shuffled).toHaveLength(originalArray.length);
      expect(shuffled).toEqual(expect.arrayContaining(originalArray));
    });

    test('should get random element from array', () => {
      const array = ['a', 'b', 'c', 'd'];
      const element = GameUtils.getRandomElement(array);
      
      expect(array).toContain(element);
    });

    test('should handle empty array', () => {
      const element = GameUtils.getRandomElement([]);
      expect(element).toBeUndefined();
    });
  });

  describe('Time Formatting', () => {
    test('should format seconds correctly', () => {
      expect(GameUtils.formatTime(0)).toBe('0:00');
      expect(GameUtils.formatTime(30)).toBe('0:30');
      expect(GameUtils.formatTime(60)).toBe('1:00');
      expect(GameUtils.formatTime(90)).toBe('1:30');
      expect(GameUtils.formatTime(3661)).toBe('61:01');
    });
  });

  describe('Input Validation', () => {
    test('should validate letters', () => {
      expect(GameUtils.validateInput('a', 'letter')).toBe(true);
      expect(GameUtils.validateInput('Z', 'letter')).toBe(true);
      expect(GameUtils.validateInput('1', 'letter')).toBe(false);
      expect(GameUtils.validateInput('ab', 'letter')).toBe(false);
      expect(GameUtils.validateInput('', 'letter')).toBe(false);
    });

    test('should validate words', () => {
      expect(GameUtils.validateInput('hello', 'word')).toBe(true);
      expect(GameUtils.validateInput('hello world', 'word')).toBe(true);
      expect(GameUtils.validateInput('hello123', 'word')).toBe(false);
      expect(GameUtils.validateInput('', 'word')).toBe(false);
    });

    test('should validate numbers', () => {
      expect(GameUtils.validateInput('123', 'number')).toBe(true);
      expect(GameUtils.validateInput('0', 'number')).toBe(true);
      expect(GameUtils.validateInput('abc', 'number')).toBe(false);
      expect(GameUtils.validateInput('12.5', 'number')).toBe(false);
    });

    test('should sanitize input', () => {
      expect(GameUtils.sanitizeInput('  HELLO  ')).toBe('hello');
      expect(GameUtils.sanitizeInput(123)).toBe('123');
      expect(GameUtils.sanitizeInput('')).toBe('');
    });
  });

  describe('Local Storage', () => {
    test('should save to localStorage', () => {
      const result = GameUtils.saveToLocalStorage('test-key', { data: 'test' });
      
      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', '{"data":"test"}');
    });

    test('should load from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('{"data":"test"}');
      
      const result = GameUtils.loadFromLocalStorage('test-key');
      
      expect(result).toEqual({ data: 'test' });
      expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
    });

    test('should return default value when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = GameUtils.loadFromLocalStorage('test-key', 'default');
      
      expect(result).toBe('default');
    });

    test('should clear localStorage', () => {
      const result = GameUtils.clearLocalStorage('test-key');
      
      expect(result).toBe(true);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
    });

    test('should clear all localStorage', () => {
      const result = GameUtils.clearLocalStorage();
      
      expect(result).toBe(true);
      expect(localStorageMock.clear).toHaveBeenCalled();
    });
  });

  describe('Device Detection', () => {
    test('should detect mobile devices', () => {
      // Mock mobile user agent
      global.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';
      
      expect(GameUtils.isMobile()).toBe(true);
    });

    test('should detect desktop devices', () => {
      // Mock desktop user agent
      global.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';
      
      expect(GameUtils.isMobile()).toBe(false);
    });

    test('should detect touch devices', () => {
      global.navigator.maxTouchPoints = 1;
      
      expect(GameUtils.isTouchDevice()).toBe(true);
    });

    test('should detect non-touch devices', () => {
      global.navigator.maxTouchPoints = 0;
      delete global.window.ontouchstart;
      
      expect(GameUtils.isTouchDevice()).toBe(false);
    });
  });

  describe('Debounce and Throttle', () => {
    test('should debounce function calls', (done) => {
      let callCount = 0;
      const debouncedFn = GameUtils.debounce(() => {
        callCount++;
      }, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 150);
    });

    test('should throttle function calls', (done) => {
      let callCount = 0;
      const throttledFn = GameUtils.throttle(() => {
        callCount++;
      }, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 50);
    });
  });
});
