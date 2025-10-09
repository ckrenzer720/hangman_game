// ========================================
// HANGMAN GAME - CORE GAME LOGIC
// ========================================

class HangmanGame {
  constructor() {
    this.gameState = {
      currentWord: "",
      hiddenWord: "",
      guessedLetters: [],
      incorrectGuesses: [],
      maxIncorrectGuesses: 6,
      gameStatus: "playing", // 'playing', 'won', 'lost'
      score: 0,
      difficulty: "medium",
      category: "animals",
    };

    this.wordLists = {};
    this.wordsLoaded = false;

    this.hangmanParts = [
      "beam",
      "rope",
      "head",
      "body",
      "left-arm",
      "right-arm",
      "left-leg",
      "right-leg",
    ];

    this.loadWords();
  }

  async loadWords() {
    try {
      const response = await fetch("data/words.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      this.wordLists = await response.json();
      this.wordsLoaded = true;
      console.log("Words loaded successfully:", this.wordLists);

      // Initialize the game once words are loaded
      this.init();
    } catch (error) {
      console.error("Error loading words:", error);
      // Fallback to a minimal word list if JSON loading fails
      this.wordLists = {
        easy: {
          animals: ["cat", "dog", "bird", "fish", "lion"],
        },
        medium: {
          animals: ["elephant", "giraffe", "penguin", "dolphin", "tiger"],
        },
        hard: {
          animals: [
            "rhinoceros",
            "hippopotamus",
            "orangutan",
            "chameleon",
            "platypus",
          ],
        },
      };
      this.wordsLoaded = true;
      this.init();
    }
  }

  init() {
    this.selectRandomWord();
    this.createHiddenWord();
    this.updateDisplay();
  }

  selectRandomWord() {
    // Check if words are loaded
    if (
      !this.wordsLoaded ||
      !this.wordLists ||
      Object.keys(this.wordLists).length === 0
    ) {
      console.warn("Words not loaded yet, skipping word selection");
      return;
    }

    const difficultyWords = this.wordLists[this.gameState.difficulty];
    if (!difficultyWords) {
      console.error(`Invalid difficulty: ${this.gameState.difficulty}`);
      this.gameState.difficulty = "medium";
      return this.selectRandomWord();
    }

    const categoryWords = difficultyWords[this.gameState.category];
    if (!categoryWords || categoryWords.length === 0) {
      console.error(
        `Invalid category: ${this.gameState.category} for difficulty: ${this.gameState.difficulty}`
      );
      // Fallback to first available category
      const availableCategories = Object.keys(difficultyWords);
      this.gameState.category = availableCategories[0];
      return this.selectRandomWord();
    }

    const randomIndex = Math.floor(Math.random() * categoryWords.length);
    this.gameState.currentWord = categoryWords[randomIndex].toLowerCase();
  }

  createHiddenWord() {
    this.gameState.hiddenWord = this.gameState.currentWord
      .split("")
      .map((letter) => (letter === " " ? " " : "_"))
      .join(" ");
  }

  makeGuess(letter) {
    if (this.gameState.gameStatus !== "playing") return false;

    letter = letter.toLowerCase();

    // Check if letter was already guessed
    if (this.gameState.guessedLetters.includes(letter)) {
      return false;
    }

    this.gameState.guessedLetters.push(letter);

    // Check if letter is in the word
    if (this.gameState.currentWord.includes(letter)) {
      this.revealLetter(letter);
      this.checkWinCondition();
      return true;
    } else {
      this.gameState.incorrectGuesses.push(letter);
      this.drawHangmanPart();
      this.checkLoseCondition();
      return false;
    }
  }

  revealLetter(letter) {
    const wordArray = this.gameState.hiddenWord.split(" ");
    const currentWordArray = this.gameState.currentWord.split("");

    currentWordArray.forEach((char, index) => {
      if (char === letter) {
        wordArray[index] = letter;
      }
    });

    this.gameState.hiddenWord = wordArray.join(" ");
  }

  drawHangmanPart() {
    const partIndex = this.gameState.incorrectGuesses.length - 1;
    if (partIndex < this.hangmanParts.length) {
      const part = this.hangmanParts[partIndex];
      const element = document.querySelector(`.hangman-figure .${part}`);
      if (element) {
        element.classList.add("show");
      }
    }
  }

  checkWinCondition() {
    const hiddenLetters = this.gameState.hiddenWord.replace(/\s/g, "");
    const currentLetters = this.gameState.currentWord.replace(/\s/g, "");

    if (hiddenLetters === currentLetters) {
      this.gameState.gameStatus = "won";
      this.gameState.score += 100;
      this.showGameOverModal("You Won!", this.gameState.currentWord);
    }
  }

  checkLoseCondition() {
    if (
      this.gameState.incorrectGuesses.length >=
      this.gameState.maxIncorrectGuesses
    ) {
      this.gameState.gameStatus = "lost";
      this.showGameOverModal("Game Over!", this.gameState.currentWord);
    }
  }

  showGameOverModal(result, word) {
    const modal = document.getElementById("game-over-modal");
    const resultElement = document.getElementById("game-result");
    const wordElement = document.getElementById("correct-word");

    if (modal && resultElement && wordElement) {
      resultElement.textContent = result;
      resultElement.className = result === "You Won!" ? "win" : "lose";
      wordElement.textContent = `The word was: ${word.toUpperCase()}`;
      modal.classList.add("show");
    }
  }

  hideGameOverModal() {
    const modal = document.getElementById("game-over-modal");
    if (modal) {
      modal.classList.remove("show");
    }
  }

  resetGame() {
    this.gameState = {
      currentWord: "",
      hiddenWord: "",
      guessedLetters: [],
      incorrectGuesses: [],
      maxIncorrectGuesses: 6,
      gameStatus: "playing",
      score: this.gameState.score, // Keep score
      difficulty: this.gameState.difficulty,
      category: this.gameState.category,
    };

    // Reset hangman figure
    this.hangmanParts.forEach((part) => {
      const element = document.querySelector(`.hangman-figure .${part}`);
      if (element) {
        element.classList.remove("show");
      }
    });

    this.init();
  }

  updateDisplay() {
    this.updateWordDisplay();
    this.updateIncorrectLetters();
    this.updateKeyboard();
  }

  updateWordDisplay() {
    const wordDisplay = document.getElementById("word-display");
    if (wordDisplay) {
      wordDisplay.innerHTML = this.gameState.hiddenWord
        .split("")
        .map((char, index) => {
          if (char === " ") return " ";
          const isRevealed = char !== "_";
          const letterClass = isRevealed
            ? "word-letter revealed"
            : "word-letter";
          return `<span class="${letterClass}">${char}</span>`;
        })
        .join("");
    }
  }

  updateIncorrectLetters() {
    const incorrectDisplay = document.getElementById("incorrect-letters");
    if (incorrectDisplay) {
      incorrectDisplay.textContent = this.gameState.incorrectGuesses.join(", ");
    }
  }

  updateKeyboard() {
    const keyboardKeys = document.querySelectorAll(".keyboard-key");
    keyboardKeys.forEach((key) => {
      const letter = key.textContent.toLowerCase();
      key.disabled = this.gameState.guessedLetters.includes(letter);

      // Remove previous state classes
      key.classList.remove("correct", "incorrect");

      if (this.gameState.guessedLetters.includes(letter)) {
        if (this.gameState.currentWord.includes(letter)) {
          key.classList.add("correct");
        } else {
          key.classList.add("incorrect");
        }
      }
    });
  }

  getHint() {
    if (this.gameState.gameStatus !== "playing") return;

    const unrevealedLetters = this.gameState.currentWord
      .split("")
      .filter((letter, index) => {
        return (
          letter !== " " && this.gameState.hiddenWord.split(" ")[index] === "_"
        );
      });

    if (unrevealedLetters.length > 0) {
      const randomLetter =
        unrevealedLetters[Math.floor(Math.random() * unrevealedLetters.length)];
      this.makeGuess(randomLetter);
    }
  }
}

// Export for use in other files
window.HangmanGame = HangmanGame;
