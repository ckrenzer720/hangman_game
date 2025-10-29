// ========================================
// HANGMAN GAME - CHALLENGE SYSTEM
// ========================================

class ChallengeSystem {
  constructor() {
    this.challenges = {
      daily: {
        enabled: true,
        currentChallenge: null,
        completedToday: false,
        streak: 0,
        bestStreak: 0,
        lastCompletedDate: null,
      },
      weekly: {
        enabled: true,
        currentTournament: null,
        participants: [],
        leaderboard: [],
        startDate: null,
        endDate: null,
      },
      themed: {
        enabled: true,
        activeThemes: [],
        completedThemes: [],
        specialCategories: {},
      },
    };

    this.leaderboard = {
      daily: [],
      weekly: [],
      allTime: [],
    };

    this.initializeChallenges();
  }

  /**
   * Initializes challenge system
   */
  initializeChallenges() {
    this.loadChallengeData();
    this.generateDailyChallenge();
    this.generateWeeklyTournament();
    this.updateThemedCategories();
  }

  /**
   * Generates daily challenge
   */
  generateDailyChallenge() {
    const today = new Date().toDateString();

    // Check if we already have a challenge for today
    if (
      this.challenges.daily.currentChallenge &&
      this.challenges.daily.currentChallenge.date === today
    ) {
      return;
    }

    // Generate new daily challenge
    const challengeTypes = ["speed", "accuracy", "difficulty", "category"];
    const challengeType =
      challengeTypes[Math.floor(Math.random() * challengeTypes.length)];

    this.challenges.daily.currentChallenge = {
      id: `daily_${Date.now()}`,
      date: today,
      type: challengeType,
      word: this.selectChallengeWord(challengeType),
      difficulty: this.getRandomDifficulty(),
      category: this.getRandomCategory(),
      timeLimit: this.getTimeLimitForChallenge(challengeType),
      targetScore: this.getTargetScoreForChallenge(challengeType),
      description: this.getChallengeDescription(challengeType),
      rewards: this.getChallengeRewards(challengeType),
    };

    this.saveChallengeData();
  }

  /**
   * Generates weekly tournament
   */
  generateWeeklyTournament() {
    const now = new Date();
    const weekStart = this.getWeekStart(now);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Check if we already have a tournament for this week
    if (
      this.challenges.weekly.currentTournament &&
      this.challenges.weekly.startDate === weekStart.toDateString()
    ) {
      return;
    }

    // Generate new weekly tournament
    this.challenges.weekly.currentTournament = {
      id: `weekly_${weekStart.getTime()}`,
      name: this.generateTournamentName(),
      theme: this.getRandomTheme(),
      rules: this.getTournamentRules(),
      prizes: this.getTournamentPrizes(),
    };

    this.challenges.weekly.startDate = weekStart.toDateString();
    this.challenges.weekly.endDate = weekEnd.toDateString();
    this.challenges.weekly.participants = [];
    this.challenges.weekly.leaderboard = [];

    this.saveChallengeData();
  }

  /**
   * Updates themed categories
   */
  updateThemedCategories() {
    const themes = [
      {
        name: "Halloween",
        categories: ["spooky", "monsters", "costumes"],
        active: this.isHalloweenSeason(),
        icon: "🎃",
      },
      {
        name: "Christmas",
        categories: ["holiday", "winter", "gifts"],
        active: this.isChristmasSeason(),
        icon: "🎄",
      },
      {
        name: "Summer",
        categories: ["beach", "vacation", "outdoor"],
        active: this.isSummerSeason(),
        icon: "☀️",
      },
      {
        name: "Space",
        categories: ["planets", "astronomy", "exploration"],
        active: true,
        icon: "🚀",
      },
      {
        name: "Food",
        categories: ["recipes", "cuisine", "ingredients"],
        active: true,
        icon: "🍽️",
      },
    ];

    this.challenges.themed.activeThemes = themes.filter(
      (theme) => theme.active
    );

    // Generate special words for active themes
    themes.forEach((theme) => {
      if (theme.active) {
        this.challenges.themed.specialCategories[theme.name] = {
          words: this.generateThemeWords(theme),
          difficulty: "medium",
          bonusMultiplier: 1.5,
        };
      }
    });

    this.saveChallengeData();
  }

  /**
   * Selects a word for challenge
   * @param {string} challengeType - Type of challenge
   * @returns {string} - Selected word
   */
  selectChallengeWord(challengeType) {
    const wordLists = {
      speed: ["quick", "fast", "rapid", "swift", "hurry"],
      accuracy: ["precise", "exact", "perfect", "accurate", "correct"],
      difficulty: ["challenging", "complex", "difficult", "hard", "tough"],
      category: this.getRandomCategoryWords(),
    };

    const words = wordLists[challengeType] || wordLists.speed;
    return words[Math.floor(Math.random() * words.length)];
  }

  /**
   * Gets time limit for challenge type
   * @param {string} challengeType - Type of challenge
   * @returns {number} - Time limit in milliseconds
   */
  getTimeLimitForChallenge(challengeType) {
    const limits = {
      speed: 30000, // 30 seconds
      accuracy: 120000, // 2 minutes
      difficulty: 180000, // 3 minutes
      category: 90000, // 1.5 minutes
    };
    return limits[challengeType] || 60000;
  }

  /**
   * Gets target score for challenge type
   * @param {string} challengeType - Type of challenge
   * @returns {number} - Target score
   */
  getTargetScoreForChallenge(challengeType) {
    const targets = {
      speed: 200,
      accuracy: 150,
      difficulty: 300,
      category: 180,
    };
    return targets[challengeType] || 150;
  }

  /**
   * Gets challenge description
   * @param {string} challengeType - Type of challenge
   * @returns {string} - Description
   */
  getChallengeDescription(challengeType) {
    const descriptions = {
      speed: "Complete the word as quickly as possible!",
      accuracy: "Win with perfect accuracy - no wrong guesses!",
      difficulty: "Tackle this challenging word on hard difficulty!",
      category: "Master this special themed category!",
    };
    return descriptions[challengeType] || "Complete today's challenge!";
  }

  /**
   * Gets challenge rewards
   * @param {string} challengeType - Type of challenge
   * @returns {Object} - Rewards object
   */
  getChallengeRewards(challengeType) {
    const rewards = {
      speed: { points: 100, badge: "Speed Demon", streak: 1 },
      accuracy: { points: 150, badge: "Perfect Player", streak: 2 },
      difficulty: { points: 200, badge: "Challenge Master", streak: 3 },
      category: { points: 120, badge: "Category Expert", streak: 1 },
    };
    return (
      rewards[challengeType] || {
        points: 100,
        badge: "Daily Challenger",
        streak: 1,
      }
    );
  }

  /**
   * Generates tournament name
   * @returns {string} - Tournament name
   */
  generateTournamentName() {
    const prefixes = [
      "Epic",
      "Legendary",
      "Ultimate",
      "Championship",
      "Master",
    ];
    const suffixes = [
      "Showdown",
      "Challenge",
      "Tournament",
      "Cup",
      "Championship",
    ];

    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

    return `${prefix} ${suffix}`;
  }

  /**
   * Gets tournament rules
   * @returns {Object} - Tournament rules
   */
  getTournamentRules() {
    return {
      maxAttempts: 3,
      timeLimit: 120000, // 2 minutes
      difficulty: "hard",
      scoring: "time_based",
      elimination: "bottom_50_percent",
    };
  }

  /**
   * Gets tournament prizes
   * @returns {Array} - Tournament prizes
   */
  getTournamentPrizes() {
    return [
      { position: 1, reward: "Champion Badge", points: 500 },
      { position: 2, reward: "Runner-up Badge", points: 300 },
      { position: 3, reward: "Third Place Badge", points: 200 },
      { position: "top10", reward: "Top 10 Badge", points: 100 },
    ];
  }

  /**
   * Generates theme words
   * @param {Object} theme - Theme object
   * @returns {Array} - Array of theme words
   */
  generateThemeWords(theme) {
    const themeWords = {
      spooky: ["ghost", "witch", "vampire", "zombie", "monster"],
      monsters: ["dragon", "goblin", "troll", "demon", "beast"],
      costumes: ["mask", "costume", "disguise", "outfit", "attire"],
      holiday: ["gift", "ornament", "celebration", "festival", "tradition"],
      winter: ["snow", "ice", "cold", "frost", "blizzard"],
      gifts: ["present", "package", "surprise", "treasure", "reward"],
      beach: ["sand", "wave", "ocean", "shell", "sunset"],
      vacation: ["travel", "journey", "adventure", "explore", "discover"],
      outdoor: ["nature", "forest", "mountain", "river", "valley"],
      planets: ["earth", "mars", "jupiter", "saturn", "neptune"],
      astronomy: ["star", "galaxy", "universe", "cosmos", "nebula"],
      exploration: ["discover", "adventure", "journey", "expedition", "quest"],
      recipes: ["cooking", "baking", "ingredients", "flavor", "taste"],
      cuisine: ["delicious", "flavorful", "savory", "aromatic", "gourmet"],
      ingredients: ["spice", "herb", "seasoning", "flavoring", "condiment"],
    };

    return (
      themeWords[theme.categories[0]] || [
        "challenge",
        "special",
        "unique",
        "rare",
        "exclusive",
      ]
    );
  }

  /**
   * Checks if it's Halloween season
   * @returns {boolean}
   */
  isHalloweenSeason() {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();
    return month === 9 && day >= 15; // October 15-31
  }

  /**
   * Checks if it's Christmas season
   * @returns {boolean}
   */
  isChristmasSeason() {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();
    return (month === 11 && day >= 15) || (month === 0 && day <= 7); // Dec 15 - Jan 7
  }

  /**
   * Checks if it's summer season
   * @returns {boolean}
   */
  isSummerSeason() {
    const now = new Date();
    const month = now.getMonth();
    return month >= 5 && month <= 7; // June-August
  }

  /**
   * Gets week start date
   * @param {Date} date - Date to get week start for
   * @returns {Date} - Week start date
   */
  getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  /**
   * Gets random difficulty
   * @returns {string} - Random difficulty
   */
  getRandomDifficulty() {
    const difficulties = ["easy", "medium", "hard"];
    return difficulties[Math.floor(Math.random() * difficulties.length)];
  }

  /**
   * Gets random category
   * @returns {string} - Random category
   */
  getRandomCategory() {
    const categories = ["animals", "colors", "food", "countries", "science"];
    return categories[Math.floor(Math.random() * categories.length)];
  }

  /**
   * Gets random category words
   * @returns {Array} - Array of category words
   */
  getRandomCategoryWords() {
    const categoryWords = {
      animals: ["elephant", "giraffe", "penguin", "dolphin", "tiger"],
      colors: ["purple", "orange", "turquoise", "magenta", "crimson"],
      food: ["pizza", "pasta", "sushi", "tacos", "burger"],
      countries: ["france", "germany", "japan", "brazil", "canada"],
      science: ["physics", "chemistry", "biology", "geology", "astronomy"],
    };

    const categories = Object.keys(categoryWords);
    const randomCategory =
      categories[Math.floor(Math.random() * categories.length)];
    return categoryWords[randomCategory];
  }

  /**
   * Gets random theme
   * @returns {string} - Random theme
   */
  getRandomTheme() {
    const themes = ["Speed", "Accuracy", "Endurance", "Variety", "Mastery"];
    return themes[Math.floor(Math.random() * themes.length)];
  }

  /**
   * Completes a daily challenge
   * @param {Object} result - Challenge result
   */
  completeDailyChallenge(result) {
    if (this.challenges.daily.completedToday) return;

    const challenge = this.challenges.daily.currentChallenge;
    const success = this.evaluateChallengeResult(challenge, result);

    if (success) {
      this.challenges.daily.completedToday = true;
      this.challenges.daily.streak++;
      this.challenges.daily.bestStreak = Math.max(
        this.challenges.daily.bestStreak,
        this.challenges.daily.streak
      );
      this.challenges.daily.lastCompletedDate = new Date().toDateString();

      // Award rewards
      this.awardChallengeRewards(challenge.rewards);

      // Update leaderboard
      this.updateLeaderboard("daily", {
        player: "You",
        score: result.score,
        time: result.time,
        date: new Date().toDateString(),
      });

      this.saveChallengeData();
      return true;
    }

    return false;
  }

  /**
   * Evaluates challenge result
   * @param {Object} challenge - Challenge object
   * @param {Object} result - Game result
   * @returns {boolean} - Success status
   */
  evaluateChallengeResult(challenge, result) {
    switch (challenge.type) {
      case "speed":
        return result.time <= challenge.timeLimit;
      case "accuracy":
        return result.incorrectGuesses === 0;
      case "difficulty":
        return result.difficulty === "hard" && result.won;
      case "category":
        return result.category === challenge.category && result.won;
      default:
        return result.score >= challenge.targetScore;
    }
  }

  /**
   * Awards challenge rewards
   * @param {Object} rewards - Rewards object
   */
  awardChallengeRewards(rewards) {
    // This would integrate with the game's scoring system
    if (window.game) {
      window.game.gameState.score += rewards.points;
    }

    // Show reward notification
    if (window.ui) {
      window.ui.showFeedback(
        "achievement",
        `🏆 Challenge Complete! +${rewards.points} points, ${rewards.badge} badge!`
      );
    }
  }

  /**
   * Updates leaderboard
   * @param {string} type - Leaderboard type
   * @param {Object} entry - Leaderboard entry
   */
  updateLeaderboard(type, entry) {
    if (!this.leaderboard[type]) {
      this.leaderboard[type] = [];
    }

    this.leaderboard[type].push(entry);
    this.leaderboard[type].sort((a, b) => b.score - a.score);

    // Keep only top 100 entries
    this.leaderboard[type] = this.leaderboard[type].slice(0, 100);
  }

  /**
   * Gets current challenges
   * @returns {Object} - Current challenges
   */
  getCurrentChallenges() {
    return {
      daily: this.challenges.daily.currentChallenge,
      weekly: this.challenges.weekly.currentTournament,
      themed: this.challenges.themed.activeThemes,
    };
  }

  /**
   * Gets leaderboard data
   * @param {string} type - Leaderboard type
   * @returns {Array} - Leaderboard data
   */
  getLeaderboard(type = "daily") {
    return this.leaderboard[type] || [];
  }

  /**
   * Saves challenge data to localStorage
   */
  saveChallengeData() {
    if (!GameUtils.isLocalStorageAvailable()) return;

    try {
      localStorage.setItem(
        "hangmanChallenges",
        JSON.stringify(this.challenges)
      );
      localStorage.setItem(
        "hangmanLeaderboard",
        JSON.stringify(this.leaderboard)
      );
    } catch (error) {
      console.warn("Error saving challenge data:", error);
    }
  }

  /**
   * Loads challenge data from localStorage
   */
  loadChallengeData() {
    if (!GameUtils.isLocalStorageAvailable()) return;

    try {
      const savedChallenges = localStorage.getItem("hangmanChallenges");
      if (savedChallenges) {
        this.challenges = {
          ...this.challenges,
          ...JSON.parse(savedChallenges),
        };
      }

      const savedLeaderboard = localStorage.getItem("hangmanLeaderboard");
      if (savedLeaderboard) {
        this.leaderboard = {
          ...this.leaderboard,
          ...JSON.parse(savedLeaderboard),
        };
      }
    } catch (error) {
      console.warn("Error loading challenge data:", error);
    }
  }
}

// Export for use in other files
window.ChallengeSystem = ChallengeSystem;
