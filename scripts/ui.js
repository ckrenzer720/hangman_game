// ========================================
// UI EVENT HANDLERS
// ========================================

class GameUI {
  constructor(game) {
    this.game = game;
    this.init();
  }

  init() {
    this.createVirtualKeyboard();
    this.bindEvents();
  }

  createVirtualKeyboard() {
    const keyboard = document.getElementById("keyboard");
    if (!keyboard) return;

    // Define keyboard layout as shown in the image
    const keyboardLayout = ["ABCDE", "FGHIJ", "KLMNO", "PQRST", "UVWXY", "Z"];

    keyboard.innerHTML = "";

    keyboardLayout.forEach((row) => {
      const rowElement = document.createElement("div");
      rowElement.className = "keyboard-row";

      row.split("").forEach((letter) => {
        const key = document.createElement("button");
        key.className = "keyboard-key";
        key.textContent = letter;
        key.setAttribute("data-letter", letter.toLowerCase());
        rowElement.appendChild(key);
      });

      keyboard.appendChild(rowElement);
    });
  }

  bindEvents() {
    // New Game Button
    const newGameBtn = document.getElementById("new-game");
    if (newGameBtn) {
      newGameBtn.addEventListener("click", () => this.startNewGame());
    }

    // Hint Button
    const hintBtn = document.getElementById("hint");
    if (hintBtn) {
      hintBtn.addEventListener("click", () => this.game.getHint());
    }

    // Pause/Resume Button
    const pauseResumeBtn = document.getElementById("pause-resume");
    if (pauseResumeBtn) {
      pauseResumeBtn.addEventListener("click", () => this.togglePause());
    }

    // Quit Button
    const quitBtn = document.getElementById("quit");
    if (quitBtn) {
      quitBtn.addEventListener("click", () => this.quitGame());
    }

    // Play Again Button (in modal)
    const playAgainBtn = document.getElementById("play-again");
    if (playAgainBtn) {
      playAgainBtn.addEventListener("click", () => this.startNewGame());
    }

    // Resume Button (in pause overlay)
    const resumeBtn = document.getElementById("resume-game");
    if (resumeBtn) {
      resumeBtn.addEventListener("click", () => this.resumeGame());
    }

    // Virtual Keyboard
    const keyboard = document.getElementById("keyboard");
    if (keyboard) {
      keyboard.addEventListener("click", (e) => {
        if (e.target.classList.contains("keyboard-key")) {
          this.handleLetterClick(e.target);
        }
      });
    }

    // Physical Keyboard
    document.addEventListener("keydown", (e) => this.handleKeyPress(e));

    // Modal close on background click
    const modal = document.getElementById("game-over-modal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.game.hideGameOverModal();
        }
      });
    }
  }

  handleLetterClick(keyElement) {
    if (keyElement.disabled) return;

    const letter = keyElement.getAttribute("data-letter");
    this.makeGuess(letter);
  }

  handleKeyPress(event) {
    const key = event.key.toLowerCase();

    // Handle pause/resume with space key (works in any game state except won/lost)
    if (
      key === " " &&
      this.game.gameState.gameStatus !== "won" &&
      this.game.gameState.gameStatus !== "lost"
    ) {
      event.preventDefault();
      this.togglePause();
      return;
    }

    // Only handle other keys if game is playing and not paused
    if (
      this.game.gameState.gameStatus !== "playing" ||
      this.game.gameState.isPaused
    )
      return;

    // Only handle letter keys
    if (key.length === 1 && key >= "a" && key <= "z") {
      event.preventDefault();
      this.makeGuess(key);
    }

    // Handle special keys
    if (key === "enter") {
      event.preventDefault();
      this.startNewGame();
    }

    if (key === "h") {
      event.preventDefault();
      this.game.getHint();
    }
  }

  makeGuess(letter) {
    const success = this.game.makeGuess(letter);

    // Add immediate visual feedback to the keyboard key
    const keyElement = document.querySelector(`[data-letter="${letter}"]`);
    if (keyElement) {
      if (success) {
        keyElement.classList.add("correct");
        this.addPulseAnimation(keyElement);
      } else if (this.game.gameState.guessedLetters.includes(letter)) {
        // Already guessed - no visual change needed
      } else {
        keyElement.classList.add("incorrect");
        this.addShakeAnimation(keyElement);
      }
    }

    if (success) {
      this.showFeedback(
        "success",
        `Great! "${letter.toUpperCase()}" is in the word!`
      );
    } else if (this.game.gameState.guessedLetters.includes(letter)) {
      this.showFeedback(
        "warning",
        `You already guessed "${letter.toUpperCase()}"!`
      );
    } else {
      this.showFeedback(
        "error",
        `Sorry, "${letter.toUpperCase()}" is not in the word.`
      );
    }

    this.game.updateDisplay();
    this.updateGameStatus();
  }

  startNewGame() {
    this.game.hideGameOverModal();

    // Hide pause overlay if it's showing
    const pauseOverlay = document.getElementById("pause-overlay");
    if (pauseOverlay) {
      pauseOverlay.classList.remove("show");
    }

    // Reset pause button text
    const pauseResumeBtn = document.getElementById("pause-resume");
    if (pauseResumeBtn) {
      pauseResumeBtn.textContent = "Pause";
    }

    this.game.resetGame();
    this.updateGameStatus();
    this.showFeedback("success", "New game started! Good luck!");
  }

  togglePause() {
    if (
      this.game.gameState.gameStatus === "won" ||
      this.game.gameState.gameStatus === "lost"
    ) {
      return; // Can't pause when game is over
    }

    const wasPaused = this.game.gameState.isPaused;
    const success = this.game.togglePause();

    if (success) {
      if (wasPaused) {
        this.resumeGame();
      } else {
        this.pauseGame();
      }
    }
  }

  pauseGame() {
    const pauseOverlay = document.getElementById("pause-overlay");
    const pauseResumeBtn = document.getElementById("pause-resume");

    if (pauseOverlay) {
      pauseOverlay.classList.add("show");
    }

    if (pauseResumeBtn) {
      pauseResumeBtn.textContent = "Resume";
    }

    // Disable keyboard input
    this.disableKeyboardInput();
    this.updateGameStatus();
    this.showFeedback(
      "warning",
      "Game paused. Press Space or click Resume to continue."
    );
  }

  resumeGame() {
    const pauseOverlay = document.getElementById("pause-overlay");
    const pauseResumeBtn = document.getElementById("pause-resume");

    if (pauseOverlay) {
      pauseOverlay.classList.remove("show");
    }

    if (pauseResumeBtn) {
      pauseResumeBtn.textContent = "Pause";
    }

    // Re-enable keyboard input
    this.enableKeyboardInput();
    this.updateGameStatus();
    this.showFeedback("success", "Game resumed!");
  }

  disableKeyboardInput() {
    const keyboardKeys = document.querySelectorAll(".keyboard-key");
    keyboardKeys.forEach((key) => {
      key.disabled = true;
    });
  }

  enableKeyboardInput() {
    const keyboardKeys = document.querySelectorAll(".keyboard-key");
    keyboardKeys.forEach((key) => {
      const letter = key.textContent.toLowerCase();
      key.disabled = this.game.gameState.guessedLetters.includes(letter);
    });
  }

  quitGame() {
    if (confirm("Are you sure you want to quit? Your progress will be lost.")) {
      this.game.gameState.gameStatus = "quit";
      this.showFeedback(
        "warning",
        'Game quit. Click "New Game" to start again.'
      );
    }
  }

  updateGameStatus() {
    const status = this.game.gameState.gameStatus;
    const isPaused = this.game.gameState.isPaused;
    const incorrectCount = this.game.gameState.incorrectGuesses.length;
    const maxIncorrect = this.game.gameState.maxIncorrectGuesses;

    // Update any status indicators if they exist
    const statusElement = document.getElementById("game-status");
    if (statusElement) {
      if (isPaused) {
        statusElement.textContent = "Game Paused - Press Space to resume";
      } else {
        switch (status) {
          case "playing":
            statusElement.textContent = `Guesses left: ${
              maxIncorrect - incorrectCount
            }`;
            break;
          case "won":
            statusElement.textContent = "Congratulations! You won!";
            break;
          case "lost":
            statusElement.textContent = "Game Over! Better luck next time.";
            break;
          case "quit":
            statusElement.textContent =
              "Game quit. Start a new game to continue.";
            break;
        }
      }
    }
  }

  showFeedback(type, message) {
    // Create or update feedback element
    let feedbackElement = document.getElementById("game-feedback");
    if (!feedbackElement) {
      feedbackElement = document.createElement("div");
      feedbackElement.id = "game-feedback";
      feedbackElement.className = "toast";
      document.body.appendChild(feedbackElement);
    }

    feedbackElement.textContent = message;
    feedbackElement.className = `toast ${type} show`;

    // Auto-hide after 3 seconds
    setTimeout(() => {
      feedbackElement.classList.remove("show");
    }, 3000);
  }

  // Animation helpers
  addPulseAnimation(element) {
    if (element) {
      element.classList.add("pulse");
      setTimeout(() => {
        element.classList.remove("pulse");
      }, 500);
    }
  }

  addShakeAnimation(element) {
    if (element) {
      element.classList.add("shake");
      setTimeout(() => {
        element.classList.remove("shake");
      }, 500);
    }
  }
}

// Export for use in other files
window.GameUI = GameUI;
