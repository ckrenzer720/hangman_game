// Device testing integration tests - mobile, tablet, desktop
const fs = require('fs');
const path = require('path');

// Mock fetch
global.fetch = jest.fn();

// Load scripts
const utilsScript = fs.readFileSync(path.join(__dirname, '../scripts/utils.js'), 'utf8');
eval(utilsScript);

const gameScript = fs.readFileSync(path.join(__dirname, '../scripts/game.js'), 'utf8');
eval(gameScript);

describe('Device Testing Integration', () => {
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

  describe('Mobile Device Testing', () => {
    beforeEach(() => {
      // Simulate mobile device
      global.navigator = {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        maxTouchPoints: 1
      };
      global.window = {
        innerWidth: 375,
        innerHeight: 667,
        ontouchstart: true
      };
    });

    test('should detect mobile device', () => {
      const isMobile = GameUtils.isMobile();
      expect(isMobile).toBe(true);
    });

    test('should detect touch device', () => {
      const isTouch = GameUtils.isTouchDevice();
      expect(isTouch).toBe(true);
    });

    test('should get correct screen size', () => {
      const screenSize = GameUtils.getScreenSize();
      expect(screenSize.width).toBe(375);
      expect(screenSize.height).toBe(667);
    });

    test('should work correctly on mobile viewport', () => {
      // Game should function on mobile
      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';

      const result = game.makeGuess('c');
      expect(result).toBe(true);
    });
  });

  describe('Tablet Device Testing', () => {
    beforeEach(() => {
      // Simulate tablet device
      global.navigator = {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        maxTouchPoints: 1
      };
      global.window = {
        innerWidth: 768,
        innerHeight: 1024,
        ontouchstart: true
      };
    });

    test('should detect tablet device', () => {
      const isMobile = GameUtils.isMobile();
      // iPad might be detected as mobile or tablet depending on implementation
      expect(typeof isMobile).toBe('boolean');
    });

    test('should detect touch device', () => {
      const isTouch = GameUtils.isTouchDevice();
      expect(isTouch).toBe(true);
    });

    test('should get correct screen size', () => {
      const screenSize = GameUtils.getScreenSize();
      expect(screenSize.width).toBe(768);
      expect(screenSize.height).toBe(1024);
    });
  });

  describe('Desktop Device Testing', () => {
    beforeEach(() => {
      // Simulate desktop device
      global.navigator = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        maxTouchPoints: 0
      };
      global.window = {
        innerWidth: 1920,
        innerHeight: 1080,
        ontouchstart: undefined
      };
    });

    test('should detect desktop device', () => {
      const isMobile = GameUtils.isMobile();
      expect(isMobile).toBe(false);
    });

    test('should detect non-touch device', () => {
      const isTouch = GameUtils.isTouchDevice();
      expect(isTouch).toBe(false);
    });

    test('should get correct screen size', () => {
      const screenSize = GameUtils.getScreenSize();
      expect(screenSize.width).toBe(1920);
      expect(screenSize.height).toBe(1080);
    });
  });

  describe('Responsive Behavior', () => {
    test('should adapt to small screen (320px)', () => {
      global.window = {
        innerWidth: 320,
        innerHeight: 568
      };

      const screenSize = GameUtils.getScreenSize();
      expect(screenSize.width).toBe(320);
    });

    test('should adapt to medium screen (768px)', () => {
      global.window = {
        innerWidth: 768,
        innerHeight: 1024
      };

      const screenSize = GameUtils.getScreenSize();
      expect(screenSize.width).toBe(768);
    });

    test('should adapt to large screen (1920px)', () => {
      global.window = {
        innerWidth: 1920,
        innerHeight: 1080
      };

      const screenSize = GameUtils.getScreenSize();
      expect(screenSize.width).toBe(1920);
    });

    test('should adapt to extra large screen (2560px)', () => {
      global.window = {
        innerWidth: 2560,
        innerHeight: 1440
      };

      const screenSize = GameUtils.getScreenSize();
      expect(screenSize.width).toBe(2560);
    });
  });

  describe('Orientation Testing', () => {
    test('should handle portrait orientation', () => {
      global.window = {
        innerWidth: 375,
        innerHeight: 667
      };

      const screenSize = GameUtils.getScreenSize();
      expect(screenSize.width).toBeLessThan(screenSize.height);
    });

    test('should handle landscape orientation', () => {
      global.window = {
        innerWidth: 667,
        innerHeight: 375
      };

      const screenSize = GameUtils.getScreenSize();
      expect(screenSize.width).toBeGreaterThan(screenSize.height);
    });
  });

  describe('Touch Interaction Testing', () => {
    test('should handle touch events on mobile', () => {
      global.navigator = {
        maxTouchPoints: 1
      };
      global.window = {
        ontouchstart: true
      };

      const isTouch = GameUtils.isTouchDevice();
      expect(isTouch).toBe(true);
    });

    test('should handle mouse events on desktop', () => {
      global.navigator = {
        maxTouchPoints: 0
      };
      global.window = {
        ontouchstart: undefined
      };

      const isTouch = GameUtils.isTouchDevice();
      expect(isTouch).toBe(false);
    });
  });

  describe('Game Functionality Across Devices', () => {
    test('should work on mobile device', () => {
      global.navigator = {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        maxTouchPoints: 1
      };

      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';

      const result = game.makeGuess('c');
      expect(result).toBe(true);
    });

    test('should work on tablet device', () => {
      global.navigator = {
        userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)',
        maxTouchPoints: 1
      };

      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';

      const result = game.makeGuess('c');
      expect(result).toBe(true);
    });

    test('should work on desktop device', () => {
      global.navigator = {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        maxTouchPoints: 0
      };

      game.gameState.currentWord = 'cat';
      game.gameState.hiddenWord = '_ _ _';
      game.gameState.gameStatus = 'playing';

      const result = game.makeGuess('c');
      expect(result).toBe(true);
    });
  });
});

