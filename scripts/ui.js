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

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    keyboard.innerHTML = "";

    alphabet.split("").forEach((letter) => {
      const key = document.createElement("button");
      key.className = "keyboard-key";
      key.textContent = letter;
      key.setAttribute("data-letter", letter.toLowerCase());
      keyboard.appendChild(key);
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
    if (this.game.gameState.gameStatus !== "playing") return;

    const key = event.key.toLowerCase();

    // Only handle letter keys
    if (key.length === 1 && key >= "a" && key <= "z") {
      event.preventDefault();
      this.makeGuess(key);
    }

    // Handle special keys
    if (key === "enter" || key === " ") {
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

    if (success) {
      this.showFeedback(
        "correct",
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
    this.game.resetGame();
    this.updateGameStatus();
    this.showFeedback("info", "New game started! Good luck!");
  }

  quitGame() {
    if (confirm("Are you sure you want to quit? Your progress will be lost.")) {
      this.game.gameState.gameStatus = "quit";
      this.showFeedback("info", 'Game quit. Click "New Game" to start again.');
    }
  }

  updateGameStatus() {
    const status = this.game.gameState.gameStatus;
    const incorrectCount = this.game.gameState.incorrectGuesses.length;
    const maxIncorrect = this.game.gameState.maxIncorrectGuesses;

    // Update any status indicators if they exist
    const statusElement = document.getElementById("game-status");
    if (statusElement) {
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
