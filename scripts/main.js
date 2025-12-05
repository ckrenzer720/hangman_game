// ========================================
// HANGMAN GAME - MAIN APPLICATION
// ========================================

// Initialize performance monitoring and optimization tools
let performanceMonitor;
let lazyLoader;
let memoryOptimizer;
let cacheManager;
let offlineManager;
let accessibilityManager;

// Initialize performance tools immediately (before DOM ready)
if (typeof PerformanceMonitor !== 'undefined') {
  performanceMonitor = new PerformanceMonitor({
    enabled: true,
    logToConsole: true,
    trackMemory: true
  });
  performanceMonitor.mark('app-start');
}

if (typeof LazyLoader !== 'undefined') {
  lazyLoader = new LazyLoader();
}

if (typeof MemoryOptimizer !== 'undefined') {
  memoryOptimizer = new MemoryOptimizer();
}

// Initialize cache manager and offline manager
let progressManager;
let preferencesManager;
let dataValidator;

if (typeof CacheManager !== 'undefined') {
  cacheManager = new CacheManager({
    version: '1.0.0',
    defaultExpiration: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxCacheSize: 5 * 1024 * 1024 // 5MB
  });
}

if (typeof OfflineManager !== 'undefined') {
  offlineManager = new OfflineManager({
    cacheManager: cacheManager,
    retryInterval: 5000,
    maxRetries: 3
  });
}

if (typeof ProgressManager !== 'undefined') {
  progressManager = new ProgressManager({
    cacheManager: cacheManager,
    autoSaveInterval: 30000,
    autoSaveEnabled: true
  });
}

if (typeof PreferencesManager !== 'undefined') {
  preferencesManager = new PreferencesManager({
    cacheManager: cacheManager
  });
}

// Initialize data validator
if (typeof DataValidator !== 'undefined') {
  dataValidator = new DataValidator({
    strictMode: false,
    autoRecover: true
  });
}

// Initialize accessibility manager
if (typeof AccessibilityManager !== 'undefined') {
  accessibilityManager = new AccessibilityManager({
    enabled: true,
    announceDelay: 100
  });
}

// Initialize audio manager
let audioManager;
if (typeof AudioManager !== 'undefined') {
  audioManager = new AudioManager({
    enabled: true,
    accessibilityManager: accessibilityManager,
    preferencesManager: preferencesManager
  });
}

// Initialize touch accessibility manager
let touchAccessibilityManager;
if (typeof TouchAccessibilityManager !== 'undefined') {
  touchAccessibilityManager = new TouchAccessibilityManager({
    enabled: true
  });
}

// Initialize feedback manager
let feedbackManager;
if (typeof FeedbackManager !== 'undefined') {
  feedbackManager = new FeedbackManager({
    enabled: true,
    cacheManager: cacheManager,
    preferencesManager: preferencesManager,
    analyticsEnabled: true,
    autoFlush: true
  });
}

// Start prefetching words.json early (before DOM ready)
if (typeof CacheManager !== 'undefined' && typeof fetch !== 'undefined') {
  // Prefetch words.json in background immediately
  fetch('data/words.json', { 
    method: 'GET',
    cache: 'default',
    priority: 'high'
  }).catch(() => {
    // Silently fail - will retry during normal load
  });
}

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", async function () {
  performanceMonitor?.mark('dom-ready');
  console.log("Hangman Game - Initializing...");

  // Initialize error middleware
  const errorMiddleware = new ErrorMiddleware({
    maxLogSize: 50,
    enableRecovery: true,
    enableLogging: true,
    enableUserFeedback: true,
    retryAttempts: 3,
  });

  errorMiddleware.init();
  performanceMonitor?.mark('error-middleware-init');

  // Initialize theme manager
  const themeManager = new ThemeManager();
  // Inject cache manager into theme manager
  if (cacheManager) {
    themeManager.cacheManager = cacheManager;
  }
  performanceMonitor?.mark('theme-manager-init');

  try {
    performanceMonitor?.mark('game-init-start');
    
    // Initialize the game with error handling
    const game = await errorMiddleware.handleAsyncError(
      () => {
        const gameInstance = new HangmanGame();
        gameInstance.errorMiddleware = errorMiddleware;
        // Inject memory optimizer if available
        if (memoryOptimizer) {
          gameInstance.memoryOptimizer = memoryOptimizer;
        }
        // Inject cache manager if available
        if (cacheManager) {
          gameInstance.cacheManager = cacheManager;
        }
        // Inject offline manager if available
        if (offlineManager) {
          gameInstance.offlineManager = offlineManager;
        }
        // Inject progress manager if available
        if (progressManager) {
          gameInstance.progressManager = progressManager;
          // Start auto-save
          progressManager.startAutoSave(() => gameInstance.gameState, gameInstance);
        }
        // Inject preferences manager if available
        if (preferencesManager) {
          gameInstance.preferencesManager = preferencesManager;
          preferencesManager.dataValidator = dataValidator;
        }
        // Inject data validator if available
        if (dataValidator) {
          gameInstance.dataValidator = dataValidator;
        }
        // Inject data validator into cache manager
        if (cacheManager && dataValidator) {
          cacheManager.setDataValidator(dataValidator);
        }
        // Inject accessibility manager if available
        if (accessibilityManager) {
          gameInstance.accessibilityManager = accessibilityManager;
        }
        // Inject audio manager if available
        if (audioManager) {
          gameInstance.audioManager = audioManager;
        }
        // Inject touch accessibility manager if available
        if (touchAccessibilityManager) {
          touchAccessibilityManager.game = gameInstance;
          gameInstance.touchAccessibilityManager = touchAccessibilityManager;
        }
        return gameInstance;
      },
      "game_initialization",
      { retryCount: 0, isOffline: NetworkUtils.isOffline() }
    );
    performanceMonitor?.mark('game-init-complete');
    performanceMonitor?.measure('game-initialization', 'game-init-start', 'game-init-complete');

    // Wait for words to be loaded before initializing UI
    performanceMonitor?.mark('word-loading-start');
    await errorMiddleware.handleAsyncError(
      () => waitForWordsLoaded(game),
      "word_loading",
      { timeout: 5000 }
    );
    performanceMonitor?.mark('word-loading-complete');
    performanceMonitor?.measure('word-loading', 'word-loading-start', 'word-loading-complete');

    console.log("Words loaded, initializing UI...");

    // Initialize UI with error handling
    performanceMonitor?.mark('ui-init-start');
    const ui = await errorMiddleware.handleAsyncError(
      () => {
        const uiInstance = initializeUI(game);
        // Inject lazy loader and memory optimizer if available
        if (lazyLoader) {
          uiInstance.lazyLoader = lazyLoader;
        }
        if (memoryOptimizer) {
          uiInstance.memoryOptimizer = memoryOptimizer;
        }
        // Inject accessibility manager if available
        if (accessibilityManager) {
          uiInstance.accessibilityManager = accessibilityManager;
        }
        // Inject audio manager if available
        if (audioManager) {
          uiInstance.audioManager = audioManager;
        }
        // Inject touch accessibility manager if available
        if (touchAccessibilityManager) {
          touchAccessibilityManager.ui = uiInstance;
          uiInstance.touchAccessibilityManager = touchAccessibilityManager;
        }
        // Initialize accessibility enhancements if available
        if (typeof AccessibilityEnhancements !== 'undefined' && accessibilityManager) {
          window.accessibilityEnhancements = new AccessibilityEnhancements(accessibilityManager);
        }
        return uiInstance;
      },
      "ui_initialization",
      {}
    );
    performanceMonitor?.mark('ui-init-complete');
    performanceMonitor?.measure('ui-initialization', 'ui-init-start', 'ui-init-complete');

    // Make game and UI globally accessible for debugging (only in development)
    // In production, these can be removed or conditionally assigned
    const isDevelopment = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1' ||
                          window.location.search.includes('debug=true');
    
    if (isDevelopment) {
      window.game = game;
      window.ui = ui;
      window.errorMiddleware = errorMiddleware;
      window.themeManager = themeManager;
      window.performanceMonitor = performanceMonitor;
      window.lazyLoader = lazyLoader;
      window.memoryOptimizer = memoryOptimizer;
      window.cacheManager = cacheManager;
      window.offlineManager = offlineManager;
      window.progressManager = progressManager;
      window.preferencesManager = preferencesManager;
      window.dataValidator = dataValidator;
      window.accessibilityManager = accessibilityManager;
      window.audioManager = audioManager;
      window.touchAccessibilityManager = touchAccessibilityManager;
      window.feedbackManager = feedbackManager;
    }

    // Capture final initialization metrics
    performanceMonitor?.mark('app-ready');
    performanceMonitor?.measure('total-init-time', 'app-start', 'app-ready');
    
    // Log performance report
    if (performanceMonitor) {
      const bundleSize = performanceMonitor.getBundleSize();
      performanceMonitor.trackMetric('bundleSize', bundleSize);
      
      setTimeout(() => {
        performanceMonitor.logReport();
        console.log('📦 Bundle Size:', bundleSize);
        if (memoryOptimizer) {
          console.log('💾 Memory Stats:', memoryOptimizer.getStats());
        }
      }, 1000);
    }

    console.log("Hangman Game - Ready to play!");
    console.log("Game state:", game.gameState);

    // Show welcome message
    ui.showFeedback(
      "success",
      "Welcome to Hangman! Click a letter to start guessing."
    );
  } catch (error) {
    console.error("Error initializing game:", error);

    // Handle the error with recovery strategies
    const recoveryResult = errorMiddleware.handleError(
      error,
      "game_initialization",
      {
        retryCount: 0,
        isOffline: NetworkUtils.isOffline(),
      }
    );

    if (recoveryResult.success) {
      // Try to show a minimal version of the game
      showMinimalGame(errorMiddleware);
    } else {
      // Show comprehensive error page
      showErrorPage(error, errorMiddleware);
    }
  }
});

/**
 * Wait for words to be loaded
 * @param {HangmanGame} game - Game instance
 * @returns {Promise} - Promise that resolves when words are loaded
 */
function waitForWordsLoaded(game) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max wait time

    const checkInterval = setInterval(() => {
      attempts++;

      if (game.wordsLoaded) {
        clearInterval(checkInterval);
        resolve();
      } else if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        reject(new Error("Timeout waiting for words to load"));
      }
    }, 100);
  });
}

/**
 * Initialize UI components
 * @param {HangmanGame} game - Game instance
 * @returns {GameUI} - UI instance
 */
function initializeUI(game) {
  // Use memory optimizer for DOM queries if available
  const querySelector = memoryOptimizer 
    ? (sel, ctx) => memoryOptimizer.querySelector(sel, ctx)
    : (sel, ctx) => ctx.querySelector(sel);
  
  // Hide loading indicator and show game
  const loadingIndicator = querySelector("#loading-indicator", document);
  const hangmanSection = querySelector("#hangman-section", document);
  const wordSection = querySelector(".word-section", document);
  const keyboardSection = querySelector(".keyboard-section", document);
  const controlsSection = querySelector(".controls-section", document);

  if (loadingIndicator) loadingIndicator.style.display = "none";
  if (hangmanSection) hangmanSection.style.display = "flex";
  if (wordSection) wordSection.style.display = "flex";
  if (keyboardSection) keyboardSection.style.display = "block";
  if (controlsSection) controlsSection.style.display = "flex";

  return new GameUI(game);
}

/**
 * Shows a minimal version of the game when full initialization fails
 * @param {ErrorMiddleware} errorMiddleware - Error middleware instance
 */
function showMinimalGame(errorMiddleware) {
  document.body.innerHTML = `
    <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Hangman Game - Limited Mode</h1>
      <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="color: #0066cc; margin: 0;">
          ⚠️ The game is running in limited mode due to a technical issue.
        </p>
        <p style="margin: 10px 0 0 0; font-size: 14px;">
          Some features may not be available, but you can still play with basic functionality.
        </p>
      </div>
      
      <div id="minimal-game" style="margin: 20px 0;">
        <div style="font-size: 24px; letter-spacing: 5px; margin: 20px 0; min-height: 40px;">
          <span id="minimal-word">_ _ _ _ _</span>
        </div>
        <div style="margin: 20px 0;">
          <p>Incorrect guesses: <span id="minimal-incorrect">0/6</span></p>
          <p>Guessed letters: <span id="minimal-guessed"></span></p>
        </div>
        <div style="margin: 20px 0;">
          <input type="text" id="minimal-input" placeholder="Enter a letter" maxlength="1" 
                 style="padding: 10px; font-size: 16px; text-align: center; width: 60px;">
          <button onclick="makeMinimalGuess()" style="padding: 10px 20px; font-size: 16px; margin-left: 10px;">
            Guess
          </button>
        </div>
        <div style="margin: 20px 0;">
          <button onclick="startMinimalGame()" style="padding: 10px 20px; font-size: 16px; margin: 5px;">
            New Game
          </button>
          <button onclick="location.reload()" style="padding: 10px 20px; font-size: 16px; margin: 5px;">
            Refresh Page
          </button>
        </div>
      </div>
      
      <div style="margin-top: 30px; font-size: 14px; color: #666;">
        <p>If problems persist, please try:</p>
        <ul style="text-align: left; display: inline-block;">
          <li>Refreshing the page</li>
          <li>Checking your internet connection</li>
          <li>Clearing your browser cache</li>
          <li>Using a different browser</li>
        </ul>
      </div>
    </div>
  `;

  // Initialize minimal game
  initMinimalGame();
}

/**
 * Shows a comprehensive error page when all recovery attempts fail
 * @param {Error} error - The error that occurred
 * @param {ErrorMiddleware} errorMiddleware - Error middleware instance
 */
function showErrorPage(error, errorMiddleware) {
  const userMessage = ErrorMessageFactory.createUserFriendlyMessage(
    error,
    "game_initialization"
  );

  document.body.innerHTML = `
    <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Hangman Game</h1>
      <div style="background: #ffe6e6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff4444;">
        <h2 style="color: #cc0000; margin: 0 0 10px 0;">⚠️ Unable to Load Game</h2>
        <p style="color: #666; margin: 0;">${userMessage}</p>
      </div>
      
      <div style="margin: 30px 0;">
        <button onclick="location.reload()" 
                style="padding: 15px 30px; font-size: 18px; background: #0066cc; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">
          🔄 Refresh Page
        </button>
        <button onclick="showErrorDetails()" 
                style="padding: 15px 30px; font-size: 18px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; margin: 5px;">
          🔍 Show Details
        </button>
      </div>
      
      <div id="error-details" style="display: none; text-align: left; background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Technical Details:</h3>
        <pre style="background: white; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${
          error.stack || error.message
        }</pre>
        <button onclick="hideErrorDetails()" style="margin-top: 10px; padding: 5px 15px;">Hide Details</button>
      </div>
      
      <div style="margin-top: 30px; font-size: 14px; color: #666;">
        <h3>Try these solutions:</h3>
        <ul style="text-align: left; display: inline-block;">
          <li>Check your internet connection</li>
          <li>Clear your browser cache and cookies</li>
          <li>Disable browser extensions temporarily</li>
          <li>Try using a different browser</li>
          <li>Check if JavaScript is enabled</li>
          <li>Try opening the game in an incognito/private window</li>
        </ul>
      </div>
      
      <div style="margin-top: 20px; font-size: 12px; color: #999;">
        <p>If the problem persists, please contact support with the error details above.</p>
      </div>
    </div>
  `;

  // Make error details functions globally available
  window.showErrorDetails = function () {
    document.getElementById("error-details").style.display = "block";
  };

  window.hideErrorDetails = function () {
    document.getElementById("error-details").style.display = "none";
  };
}

/**
 * Initializes minimal game functionality
 */
function initMinimalGame() {
  // Simple word list for minimal mode
  const minimalWords = [
    "CAT",
    "DOG",
    "BIRD",
    "FISH",
    "LION",
    "BEAR",
    "WOLF",
    "DEER",
    "RED",
    "BLUE",
    "GREEN",
    "YELLOW",
    "BLACK",
    "WHITE",
    "PINK",
    "PURPLE",
    "PIZZA",
    "CAKE",
    "SOUP",
    "RICE",
    "MEAT",
    "MILK",
    "BREAD",
    "CHEESE",
  ];

  let currentWord = "";
  let hiddenWord = "";
  let guessedLetters = [];
  let incorrectGuesses = 0;
  let gameStatus = "playing";

  function startMinimalGame() {
    currentWord = minimalWords[Math.floor(Math.random() * minimalWords.length)];
    hiddenWord = currentWord
      .split("")
      .map(() => "_")
      .join(" ");
    guessedLetters = [];
    incorrectGuesses = 0;
    gameStatus = "playing";
    updateMinimalDisplay();
  }

  function makeMinimalGuess() {
    if (gameStatus !== "playing") return;

    const input = document.getElementById("minimal-input");
    const letter = input.value.toUpperCase();

    if (!letter || letter.length !== 1 || !/[A-Z]/.test(letter)) {
      alert("Please enter a single letter (A-Z)");
      return;
    }

    if (guessedLetters.includes(letter)) {
      alert("You already guessed that letter!");
      return;
    }

    guessedLetters.push(letter);
    input.value = "";

    if (currentWord.includes(letter)) {
      // Correct guess
      hiddenWord = currentWord
        .split("")
        .map((char) => (guessedLetters.includes(char) ? char : "_"))
        .join(" ");

      if (!hiddenWord.includes("_")) {
        gameStatus = "won";
        alert("Congratulations! You won!");
      }
    } else {
      // Incorrect guess
      incorrectGuesses++;
      if (incorrectGuesses >= 6) {
        gameStatus = "lost";
        alert(`Game Over! The word was: ${currentWord}`);
      }
    }

    updateMinimalDisplay();
  }

  function updateMinimalDisplay() {
    document.getElementById("minimal-word").textContent = hiddenWord;
    document.getElementById(
      "minimal-incorrect"
    ).textContent = `${incorrectGuesses}/6`;
    document.getElementById("minimal-guessed").textContent =
      guessedLetters.join(", ");
  }

  // Make functions globally available
  window.startMinimalGame = startMinimalGame;
  window.makeMinimalGuess = makeMinimalGuess;

  // Handle Enter key in input
  document
    .getElementById("minimal-input")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        makeMinimalGuess();
      }
    });

  // Start the first game
  startMinimalGame();
}

// Utility functions
function debugGame() {
  if (window.game) {
    console.log("Current game state:", window.game.gameState);
    console.log("Available words:", window.game.wordLists);
  }
}

// Make debug function globally accessible
window.debugGame = debugGame;
