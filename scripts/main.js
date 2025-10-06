// ========================================
// HANGMAN GAME - MAIN APPLICATION
// ========================================

// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", function () {
  console.log("Hangman Game - Initializing...");

  // Initialize the game
  const game = new HangmanGame();
  const ui = new GameUI(game);

  // Make game and UI globally accessible for debugging
  window.game = game;
  window.ui = ui;

  console.log("Hangman Game - Ready to play!");
  console.log("Game state:", game.gameState);

  // Show welcome message
  ui.showFeedback(
    "info",
    "Welcome to Hangman! Click a letter to start guessing."
  );
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
