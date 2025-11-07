// ========================================
// DATA VALIDATOR - HANGMAN GAME
// ========================================

/**
 * DataValidator class for comprehensive data validation and error recovery
 */
class DataValidator {
  constructor(options = {}) {
    this.strictMode = options.strictMode !== false;
    this.autoRecover = options.autoRecover !== false;
    this.validationErrors = [];
    this.recoveryActions = [];
  }

  /**
   * Validate word list structure and content
   * @param {Object} wordList - Word list to validate
   * @returns {Object} Validation result
   */
  validateWordList(wordList) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      recovered: false,
      stats: {
        totalWords: 0,
        validWords: 0,
        invalidWords: 0,
        duplicates: 0,
        categories: 0,
        difficulties: 0
      }
    };

    if (!wordList || typeof wordList !== 'object') {
      result.valid = false;
      result.errors.push('Word list must be an object');
      return result;
    }

    const validDifficulties = ['easy', 'medium', 'hard'];
    const validCategories = [
      'animals', 'colors', 'food', 'countries', 'cities', 'sports',
      'music', 'movies', 'books', 'science', 'technology', 'nature',
      'weather', 'body', 'clothing', 'furniture', 'literature'
    ];

    // Validate structure
    for (const difficulty of validDifficulties) {
      if (!wordList[difficulty]) {
        if (this.strictMode) {
          result.valid = false;
          result.errors.push(`Missing difficulty level: ${difficulty}`);
        } else {
          result.warnings.push(`Missing difficulty level: ${difficulty}`);
        }
        continue;
      }

      if (typeof wordList[difficulty] !== 'object') {
        result.valid = false;
        result.errors.push(`Difficulty ${difficulty} must be an object`);
        continue;
      }

      result.stats.difficulties++;

      // Validate categories within difficulty
      for (const category in wordList[difficulty]) {
        if (!Array.isArray(wordList[difficulty][category])) {
          result.valid = false;
          result.errors.push(`Category ${category} in ${difficulty} must be an array`);
          continue;
        }

        result.stats.categories++;
        const words = wordList[difficulty][category];
        const seenWords = new Set();

        // Validate each word
        words.forEach((word, index) => {
          result.stats.totalWords++;
          const wordValidation = this.validateWord(word, difficulty, category);

          if (wordValidation.valid) {
            result.stats.validWords++;

            // Check for duplicates
            const wordKey = word.toLowerCase().trim();
            if (seenWords.has(wordKey)) {
              result.stats.duplicates++;
              result.warnings.push(`Duplicate word "${word}" in ${difficulty}/${category}`);
            } else {
              seenWords.add(wordKey);
            }
          } else {
            result.stats.invalidWords++;
            result.errors.push(`Invalid word at ${difficulty}/${category}[${index}]: ${wordValidation.error}`);
            
            // Auto-recover if enabled
            if (this.autoRecover && wordValidation.recoverable) {
              const recovered = this.recoverWord(word);
              if (recovered) {
                result.recovered = true;
                result.warnings.push(`Recovered word "${word}" -> "${recovered}"`);
                words[index] = recovered;
              }
            }
          }
        });

        // Check minimum word count
        if (words.length < 3) {
          result.warnings.push(`Category ${category} in ${difficulty} has very few words (${words.length})`);
        }
      }
    }

    // Overall validation
    if (result.stats.totalWords === 0) {
      result.valid = false;
      result.errors.push('Word list contains no words');
    }

    if (result.stats.validWords === 0 && result.stats.totalWords > 0) {
      result.valid = false;
      result.errors.push('No valid words found in word list');
    }

    return result;
  }

  /**
   * Validate a single word
   * @param {*} word - Word to validate
   * @param {string} difficulty - Difficulty level
   * @param {string} category - Category
   * @returns {Object} Validation result
   */
  validateWord(word, difficulty, category) {
    const result = {
      valid: false,
      error: '',
      recoverable: false
    };

    // Check type
    if (typeof word !== 'string') {
      result.error = 'Word must be a string';
      result.recoverable = true;
      return result;
    }

    // Check empty
    const trimmed = word.trim();
    if (trimmed.length === 0) {
      result.error = 'Word cannot be empty';
      return result;
    }

    // Check length
    if (trimmed.length < 2) {
      result.error = 'Word must be at least 2 characters';
      result.recoverable = false;
      return result;
    }

    if (trimmed.length > 50) {
      result.error = 'Word is too long (max 50 characters)';
      result.recoverable = false;
      return result;
    }

    // Check for valid characters (letters and spaces only)
    if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
      result.error = 'Word contains invalid characters (only letters and spaces allowed)';
      result.recoverable = true;
      return result;
    }

    // Check difficulty-appropriate length
    const length = trimmed.replace(/\s/g, '').length;
    if (difficulty === 'easy' && length > 8) {
      result.warning = 'Word seems too long for easy difficulty';
    } else if (difficulty === 'hard' && length < 6) {
      result.warning = 'Word seems too short for hard difficulty';
    }

    result.valid = true;
    return result;
  }

  /**
   * Attempt to recover a corrupted word
   * @param {*} word - Word to recover
   * @returns {string|null} Recovered word or null
   */
  recoverWord(word) {
    if (typeof word === 'number') {
      return null; // Can't recover numbers
    }

    if (typeof word === 'string') {
      // Remove invalid characters
      let recovered = word.replace(/[^a-zA-Z\s]/g, '');
      recovered = recovered.trim();

      if (recovered.length >= 2 && /^[a-zA-Z\s]+$/.test(recovered)) {
        return recovered;
      }
    }

    return null;
  }

  /**
   * Validate statistics with integrity checks
   * @param {Object} statistics - Statistics object to validate
   * @returns {Object} Validation result
   */
  validateStatistics(statistics) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      recovered: false,
      fixes: []
    };

    if (!statistics || typeof statistics !== 'object') {
      result.valid = false;
      result.errors.push('Statistics must be an object');
      return result;
    }

    // Check required fields
    const requiredFields = {
      gamesPlayed: 'number',
      gamesWon: 'number',
      gamesLost: 'number',
      winPercentage: 'number',
      totalGuesses: 'number',
      averageGuessesPerGame: 'number',
      longestStreak: 'number',
      currentStreak: 'number',
      bestStreak: 'number',
      totalPlayTime: 'number',
      averagePlayTime: 'number'
    };

    for (const [field, expectedType] of Object.entries(requiredFields)) {
      if (!statistics.hasOwnProperty(field)) {
        if (this.strictMode) {
          result.valid = false;
          result.errors.push(`Missing required field: ${field}`);
        } else if (this.autoRecover) {
          statistics[field] = this.getDefaultValue(expectedType);
          result.fixes.push(`Added missing field: ${field}`);
          result.recovered = true;
        }
      } else if (typeof statistics[field] !== expectedType) {
        if (this.autoRecover) {
          statistics[field] = this.convertType(statistics[field], expectedType);
          result.fixes.push(`Fixed type for field: ${field}`);
          result.recovered = true;
        } else {
          result.errors.push(`Invalid type for ${field}: expected ${expectedType}, got ${typeof statistics[field]}`);
        }
      }
    }

    // Integrity checks
    if (statistics.gamesPlayed !== undefined && statistics.gamesWon !== undefined && statistics.gamesLost !== undefined) {
      const calculatedTotal = statistics.gamesWon + statistics.gamesLost;
      if (statistics.gamesPlayed !== calculatedTotal) {
        result.warnings.push(`Games played (${statistics.gamesPlayed}) doesn't match wins + losses (${calculatedTotal})`);
        if (this.autoRecover) {
          statistics.gamesPlayed = calculatedTotal;
          result.fixes.push('Fixed gamesPlayed to match wins + losses');
          result.recovered = true;
        }
      }
    }

    // Win percentage check
    if (statistics.gamesPlayed > 0 && statistics.gamesWon !== undefined) {
      const calculatedPercentage = (statistics.gamesWon / statistics.gamesPlayed) * 100;
      if (Math.abs(statistics.winPercentage - calculatedPercentage) > 0.1) {
        result.warnings.push(`Win percentage doesn't match calculated value`);
        if (this.autoRecover) {
          statistics.winPercentage = Math.round(calculatedPercentage * 100) / 100;
          result.fixes.push('Fixed win percentage');
          result.recovered = true;
        }
      }
    }

    // Average guesses check
    if (statistics.gamesPlayed > 0 && statistics.totalGuesses !== undefined) {
      const calculatedAverage = statistics.totalGuesses / statistics.gamesPlayed;
      if (Math.abs(statistics.averageGuessesPerGame - calculatedAverage) > 0.1) {
        result.warnings.push(`Average guesses doesn't match calculated value`);
        if (this.autoRecover) {
          statistics.averageGuessesPerGame = Math.round(calculatedAverage * 100) / 100;
          result.fixes.push('Fixed average guesses');
          result.recovered = true;
        }
      }
    }

    // Range checks
    if (statistics.gamesPlayed < 0) {
      result.errors.push('gamesPlayed cannot be negative');
      if (this.autoRecover) {
        statistics.gamesPlayed = 0;
        result.fixes.push('Fixed negative gamesPlayed');
        result.recovered = true;
      }
    }

    if (statistics.winPercentage < 0 || statistics.winPercentage > 100) {
      result.errors.push('winPercentage must be between 0 and 100');
      if (this.autoRecover) {
        statistics.winPercentage = Math.max(0, Math.min(100, statistics.winPercentage));
        result.fixes.push('Fixed win percentage range');
        result.recovered = true;
      }
    }

    // Validate nested structures
    if (statistics.difficultyStats) {
      const difficultyValidation = this.validateDifficultyStats(statistics.difficultyStats);
      if (!difficultyValidation.valid) {
        result.errors.push(...difficultyValidation.errors);
        result.warnings.push(...difficultyValidation.warnings);
        if (difficultyValidation.recovered) {
          result.recovered = true;
        }
      }
    }

    if (statistics.gameHistory && Array.isArray(statistics.gameHistory)) {
      const historyValidation = this.validateGameHistory(statistics.gameHistory);
      if (!historyValidation.valid) {
        result.warnings.push(...historyValidation.warnings);
        if (historyValidation.recovered) {
          result.recovered = true;
        }
      }
    }

    return result;
  }

  /**
   * Validate difficulty statistics
   * @param {Object} difficultyStats - Difficulty stats to validate
   * @returns {Object} Validation result
   */
  validateDifficultyStats(difficultyStats) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      recovered: false
    };

    const validDifficulties = ['easy', 'medium', 'hard'];

    for (const difficulty of validDifficulties) {
      if (!difficultyStats[difficulty]) {
        if (this.autoRecover) {
          difficultyStats[difficulty] = {
            played: 0,
            won: 0,
            lost: 0,
            totalTime: 0,
            averageTime: 0,
            bestTime: null
          };
          result.recovered = true;
        } else {
          result.warnings.push(`Missing difficulty stats for: ${difficulty}`);
        }
      } else {
        const stats = difficultyStats[difficulty];
        if (stats.played !== undefined && stats.won !== undefined && stats.lost !== undefined) {
          const total = stats.won + stats.lost;
          if (stats.played !== total && this.autoRecover) {
            stats.played = total;
            result.recovered = true;
          }
        }
      }
    }

    return result;
  }

  /**
   * Validate game history
   * @param {Array} gameHistory - Game history array
   * @returns {Object} Validation result
   */
  validateGameHistory(gameHistory) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      recovered: false
    };

    if (!Array.isArray(gameHistory)) {
      result.valid = false;
      result.errors.push('Game history must be an array');
      return result;
    }

    // Limit history size
    if (gameHistory.length > 1000) {
      result.warnings.push(`Game history is very large (${gameHistory.length} entries)`);
      if (this.autoRecover) {
        gameHistory.splice(1000); // Keep only last 1000
        result.recovered = true;
      }
    }

    return result;
  }

  /**
   * Validate settings/preferences
   * @param {Object} settings - Settings object to validate
   * @returns {Object} Validation result
   */
  validateSettings(settings) {
    const result = {
      valid: true,
      errors: [],
      warnings: [],
      recovered: false,
      fixes: []
    };

    if (!settings || typeof settings !== 'object') {
      result.valid = false;
      result.errors.push('Settings must be an object');
      return result;
    }

    // Validate theme
    const validThemes = ['light', 'dark', 'blue', 'green', 'purple', 'high-contrast'];
    if (settings.theme && !validThemes.includes(settings.theme)) {
      result.errors.push(`Invalid theme: ${settings.theme}`);
      if (this.autoRecover) {
        settings.theme = 'light';
        result.fixes.push('Reset theme to default');
        result.recovered = true;
      }
    }

    // Validate font size
    const validFontSizes = ['small', 'normal', 'large', 'extra-large'];
    if (settings.fontSize && !validFontSizes.includes(settings.fontSize)) {
      result.errors.push(`Invalid font size: ${settings.fontSize}`);
      if (this.autoRecover) {
        settings.fontSize = 'normal';
        result.fixes.push('Reset font size to default');
        result.recovered = true;
      }
    }

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (settings.difficulty && !validDifficulties.includes(settings.difficulty)) {
      result.errors.push(`Invalid difficulty: ${settings.difficulty}`);
      if (this.autoRecover) {
        settings.difficulty = 'medium';
        result.fixes.push('Reset difficulty to default');
        result.recovered = true;
      }
    }

    // Validate volume
    if (settings.soundVolume !== undefined) {
      if (typeof settings.soundVolume !== 'number' || settings.soundVolume < 0 || settings.soundVolume > 1) {
        result.warnings.push('Sound volume must be between 0 and 1');
        if (this.autoRecover) {
          settings.soundVolume = Math.max(0, Math.min(1, settings.soundVolume || 0.5));
          result.fixes.push('Fixed sound volume range');
          result.recovered = true;
        }
      }
    }

    // Validate boolean fields
    const booleanFields = ['autoSave', 'animations', 'sound', 'hintsEnabled', 'showProgress', 'showTimer'];
    booleanFields.forEach(field => {
      if (settings[field] !== undefined && typeof settings[field] !== 'boolean') {
        result.warnings.push(`${field} should be a boolean`);
        if (this.autoRecover) {
          settings[field] = !!settings[field];
          result.fixes.push(`Fixed ${field} to boolean`);
          result.recovered = true;
        }
      }
    });

    return result;
  }

  /**
   * Recover corrupted data
   * @param {Object} data - Data to recover
   * @param {string} type - Data type ('wordList', 'statistics', 'settings', 'progress')
   * @returns {Object} Recovery result
   */
  recoverData(data, type) {
    const result = {
      success: false,
      recovered: null,
      errors: [],
      fixes: []
    };

    try {
      switch (type) {
        case 'wordList':
          const wordListValidation = this.validateWordList(data);
          if (wordListValidation.recovered) {
            result.success = true;
            result.recovered = data;
            result.fixes = wordListValidation.warnings;
          }
          break;

        case 'statistics':
          const statsValidation = this.validateStatistics(data);
          if (statsValidation.recovered) {
            result.success = true;
            result.recovered = data;
            result.fixes = statsValidation.fixes;
          }
          break;

        case 'settings':
          const settingsValidation = this.validateSettings(data);
          if (settingsValidation.recovered) {
            result.success = true;
            result.recovered = data;
            result.fixes = settingsValidation.fixes;
          }
          break;

        default:
          result.errors.push(`Unknown data type: ${type}`);
      }
    } catch (error) {
      result.errors.push(`Recovery failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Get default value for a type
   * @param {string} type - Type name
   * @returns {*} Default value
   */
  getDefaultValue(type) {
    switch (type) {
      case 'number':
        return 0;
      case 'string':
        return '';
      case 'boolean':
        return false;
      case 'object':
        return {};
      case 'array':
        return [];
      default:
        return null;
    }
  }

  /**
   * Convert value to specified type
   * @param {*} value - Value to convert
   * @param {string} targetType - Target type
   * @returns {*} Converted value
   */
  convertType(value, targetType) {
    switch (targetType) {
      case 'number':
        const num = Number(value);
        return isNaN(num) ? 0 : num;
      case 'string':
        return String(value);
      case 'boolean':
        return !!value;
      default:
        return value;
    }
  }

  /**
   * Clear validation errors
   */
  clearErrors() {
    this.validationErrors = [];
    this.recoveryActions = [];
  }

  /**
   * Get validation summary
   * @returns {Object} Summary of all validations
   */
  getSummary() {
    return {
      totalErrors: this.validationErrors.length,
      totalRecoveries: this.recoveryActions.length,
      errors: [...this.validationErrors],
      recoveries: [...this.recoveryActions]
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataValidator;
}

