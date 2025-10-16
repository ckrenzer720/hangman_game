// ========================================
// HANGMAN GAME - MAIN APPLICATION
// ========================================

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", async function () {
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

  try {
    // Initialize the game with error handling
    const game = await errorMiddleware.handleAsyncError(
      () => {
        const gameInstance = new HangmanGame();
        gameInstance.errorMiddleware = errorMiddleware;
        return gameInstance;
      },
      "game_initialization",
      { retryCount: 0, isOffline: NetworkUtils.isOffline() }
    );

    // Wait for words to be loaded before initializing UI
    await errorMiddleware.handleAsyncError(
      () => waitForWordsLoaded(game),
      "word_loading",
      { timeout: 5000 }
    );

    console.log("Words loaded, initializing UI...");

    // Initialize UI with error handling
    const ui = await errorMiddleware.handleAsyncError(
      () => initializeUI(game),
      "ui_initialization",
      {}
    );

    // Make game and UI globally accessible for debugging
    window.game = game;
    window.ui = ui;
    window.errorMiddleware = errorMiddleware;

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
  // Hide loading indicator and show game
  const loadingIndicator = document.getElementById("loading-indicator");
  const hangmanSection = document.getElementById("hangman-section");
  const wordSection = document.querySelector(".word-section");
  const keyboardSection = document.querySelector(".keyboard-section");
  const controlsSection = document.querySelector(".controls-section");

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
