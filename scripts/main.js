// ========================================
// HANGMAN GAME - MAIN APPLICATION
// ========================================

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Hangman Game - Initializing...");

  // Initialize the game
  const game = new HangmanGame();

  // Wait for words to be loaded before initializing UI
  const checkWordsLoaded = () => {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (game.wordsLoaded) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  };

  try {
    await checkWordsLoaded();
    console.log("Words loaded, initializing UI...");

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

    const ui = new GameUI(game);

    // Make game and UI globally accessible for debugging
    window.game = game;
    window.ui = ui;

    console.log("Hangman Game - Ready to play!");
    console.log("Game state:", game.gameState);

    // Show welcome message
    ui.showFeedback(
      "success",
      "Welcome to Hangman! Click a letter to start guessing."
    );
  } catch (error) {
    console.error("Error initializing game:", error);
    // Show error message to user
    document.body.innerHTML = `
      <div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
        <h1>Hangman Game</h1>
        <p style="color: red;">Error loading game. Please refresh the page.</p>
        <button onclick="location.reload()" style="padding: 10px 20px; font-size: 16px;">Refresh Page</button>
      </div>
    `;
  }
});

// Utility functions
function debugGame() {
  if (window.game) {
    console.log("Current game state:", window.game.gameState);
    console.log("Available words:", window.game.wordLists);
  }
}

// Make debug function globally accessible
window.debugGame = debugGame;
