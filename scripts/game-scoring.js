// ========================================
// HANGMAN GAME - SCORING MODULE
// ========================================
// This module handles score calculations and time bonuses

/**
 * Scoring Mixin for HangmanGame
 * Extends HangmanGame with scoring-related functionality
 */
const ScoringMixin = {
  calculateScore() {
    const difficultyMultipliers = {
      easy: 1,
      medium: 2,
      hard: 3,
    };

    const baseScore = 100;
    const difficultyMultiplier =
      difficultyMultipliers[this.gameState.difficulty] || 1;

    // Bonus for fewer incorrect guesses
    const incorrectGuesses = this.gameState.incorrectGuesses.length;
    const maxGuesses = this.gameState.maxIncorrectGuesses;
    const efficiencyBonus = Math.max(0, (maxGuesses - incorrectGuesses) * 10);

    let timeBonus = 0;

    // Time-based scoring for timed mode
    if (this.gameState.timedMode) {
      timeBonus = this.calculateTimeBonus();
    } else {
      // Regular time bonus (faster completion = more points)
      const playTime = this.endGameTimer();
      timeBonus = Math.max(0, Math.floor((30000 - playTime) / 1000) * 2);
    }

    let totalScore =
      (baseScore + efficiencyBonus + timeBonus) * difficultyMultiplier;

    // Apply practice hint penalties
    if (this.gameState.practiceMode?.enabled) {
      totalScore = Math.round(
        totalScore * this.gameState.practiceMode.scorePenaltyMultiplier
      );
    }
    return Math.max(50, totalScore); // Minimum score of 50
  },

  /**
   * Calculates time bonus for scoring
   * @returns {number} - Time bonus points
   */
  calculateTimeBonus() {
    if (!this.gameState.timedMode) return 0;

    const percentageRemaining =
      this.gameState.timeRemaining / this.gameState.timeLimit;

    // Bonus based on how much time is left
    // 50 points if you finish with 50% time remaining
    // 100 points if you finish with 100% time remaining
    const timeBonus = Math.round(percentageRemaining * 100);

    return timeBonus;
  },
};

// Export for use in game.js
if (typeof window !== "undefined") {
  window.ScoringMixin = ScoringMixin;
}

