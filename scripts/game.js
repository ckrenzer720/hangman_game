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
      gameStatus: "playing", // 'playing', 'won', 'lost', 'paused'
      isPaused: false,
      score: 0,
      difficulty: "medium",
      category: "animals",
      gameStartTime: null,
      gameEndTime: null,
    };

    // Statistics tracking
    this.statistics = this.loadStatistics();

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
    this.startGameTimer();
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
    if (this.gameState.gameStatus !== "playing" || this.gameState.isPaused)
      return false;

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
      this.updateStatistics("won");
      this.showGameOverModal("You Won!", this.gameState.currentWord);
    }
  }

  checkLoseCondition() {
    if (
      this.gameState.incorrectGuesses.length >=
      this.gameState.maxIncorrectGuesses
    ) {
      this.gameState.gameStatus = "lost";
      this.updateStatistics("lost");
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
      isPaused: false,
      score: this.gameState.score, // Keep score
      difficulty: this.gameState.difficulty,
      category: this.gameState.category,
      gameStartTime: null,
      gameEndTime: null,
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
    if (this.gameState.gameStatus !== "playing" || this.gameState.isPaused)
      return;

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

  pauseGame() {
    if (this.gameState.gameStatus === "playing" && !this.gameState.isPaused) {
      this.gameState.isPaused = true;
      this.gameState.gameStatus = "paused";
      return true;
    }
    return false;
  }

  resumeGame() {
    if (this.gameState.gameStatus === "paused" && this.gameState.isPaused) {
      this.gameState.isPaused = false;
      this.gameState.gameStatus = "playing";
      return true;
    }
    return false;
  }

  togglePause() {
    if (this.gameState.isPaused) {
      return this.resumeGame();
    } else {
      return this.pauseGame();
    }
  }

  // ========================================
  // STATISTICS MANAGEMENT
  // ========================================

  loadStatistics() {
    try {
      const savedStats = localStorage.getItem("hangmanStatistics");
      if (savedStats) {
        return JSON.parse(savedStats);
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
    }

    // Return default statistics structure
    return {
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      winPercentage: 0,
      totalGuesses: 0,
      averageGuessesPerGame: 0,
      fastestCompletionTime: null,
      longestStreak: 0,
      currentStreak: 0,
      bestStreak: 0,
      totalPlayTime: 0,
      averagePlayTime: 0,
      difficultyStats: {
        easy: { played: 0, won: 0, lost: 0 },
        medium: { played: 0, won: 0, lost: 0 },
        hard: { played: 0, won: 0, lost: 0 },
      },
      categoryStats: {},
      lastPlayed: null,
    };
  }

  saveStatistics() {
    try {
      localStorage.setItem(
        "hangmanStatistics",
        JSON.stringify(this.statistics)
      );
    } catch (error) {
      console.error("Error saving statistics:", error);
    }
  }

  startGameTimer() {
    this.gameState.gameStartTime = Date.now();
  }

  endGameTimer() {
    this.gameState.gameEndTime = Date.now();
    return this.gameState.gameEndTime - this.gameState.gameStartTime;
  }

  updateStatistics(gameResult) {
    const playTime = this.endGameTimer();
    const totalGuesses = this.gameState.guessedLetters.length;

    // Update basic counts
    this.statistics.gamesPlayed++;
    if (gameResult === "won") {
      this.statistics.gamesWon++;
      this.statistics.currentStreak++;
      this.statistics.bestStreak = Math.max(
        this.statistics.bestStreak,
        this.statistics.currentStreak
      );
    } else if (gameResult === "lost") {
      this.statistics.gamesLost++;
      this.statistics.currentStreak = 0;
    }

    // Update win percentage
    this.statistics.winPercentage =
      this.statistics.gamesPlayed > 0
        ? Math.round(
            (this.statistics.gamesWon / this.statistics.gamesPlayed) * 100
          )
        : 0;

    // Update guess statistics
    this.statistics.totalGuesses += totalGuesses;
    this.statistics.averageGuessesPerGame =
      this.statistics.gamesPlayed > 0
        ? Math.round(this.statistics.totalGuesses / this.statistics.gamesPlayed)
        : 0;

    // Update time statistics
    this.statistics.totalPlayTime += playTime;
    this.statistics.averagePlayTime =
      this.statistics.gamesPlayed > 0
        ? Math.round(
            this.statistics.totalPlayTime / this.statistics.gamesPlayed
          )
        : 0;

    // Update fastest completion time (only for wins)
    if (gameResult === "won") {
      if (
        !this.statistics.fastestCompletionTime ||
        playTime < this.statistics.fastestCompletionTime
      ) {
        this.statistics.fastestCompletionTime = playTime;
      }
    }

    // Update difficulty statistics
    const difficulty = this.gameState.difficulty;
    this.statistics.difficultyStats[difficulty].played++;
    if (gameResult === "won") {
      this.statistics.difficultyStats[difficulty].won++;
    } else if (gameResult === "lost") {
      this.statistics.difficultyStats[difficulty].lost++;
    }

    // Update category statistics
    const category = this.gameState.category;
    if (!this.statistics.categoryStats[category]) {
      this.statistics.categoryStats[category] = { played: 0, won: 0, lost: 0 };
    }
    this.statistics.categoryStats[category].played++;
    if (gameResult === "won") {
      this.statistics.categoryStats[category].won++;
    } else if (gameResult === "lost") {
      this.statistics.categoryStats[category].lost++;
    }

    // Update last played
    this.statistics.lastPlayed = new Date().toISOString();

    // Save to localStorage
    this.saveStatistics();
  }

  getStatistics() {
    return { ...this.statistics };
  }

  resetStatistics() {
    this.statistics = this.loadStatistics();
    this.statistics.gamesPlayed = 0;
    this.statistics.gamesWon = 0;
    this.statistics.gamesLost = 0;
    this.statistics.winPercentage = 0;
    this.statistics.totalGuesses = 0;
    this.statistics.averageGuessesPerGame = 0;
    this.statistics.fastestCompletionTime = null;
    this.statistics.longestStreak = 0;
    this.statistics.currentStreak = 0;
    this.statistics.bestStreak = 0;
    this.statistics.totalPlayTime = 0;
    this.statistics.averagePlayTime = 0;
    this.statistics.difficultyStats = {
      easy: { played: 0, won: 0, lost: 0 },
      medium: { played: 0, won: 0, lost: 0 },
      hard: { played: 0, won: 0, lost: 0 },
    };
    this.statistics.categoryStats = {};
    this.statistics.lastPlayed = null;
    this.saveStatistics();
  }
}

// Export for use in other files
window.HangmanGame = HangmanGame;
