// ========================================
// HANGMAN GAME - WORD LOADER MODULE
// ========================================
// This module handles loading word lists from separate JSON files

/**
 * Word Loader Utility
 * Loads words from separate difficulty files and combines them
 */
class WordLoader {
  /**
   * Loads all word lists from separate difficulty files
   * @param {Object} options - Loading options
   * @param {Function} fetchFn - Custom fetch function (for offline support)
   * @returns {Promise<Object>} Combined word lists by difficulty
   */
  static async loadAllWords(options = {}, fetchFn = null) {
    const difficulties = ["easy", "medium", "hard"];
    const wordLists = {};

    // Use provided fetch function or default fetch
    const fetch = fetchFn || window.fetch;

    // Load each difficulty file
    const loadPromises = difficulties.map(async (difficulty) => {
      try {
        const url = `data/words/${difficulty}.json`;
        let response;

        if (fetchFn) {
          // Use custom fetch (e.g., from offline manager)
          response = await fetchFn(url, {}, "words_" + difficulty);
        } else {
          // Use standard fetch with timeout
          if (
            typeof window !== "undefined" &&
            window.NetworkUtils &&
            window.NetworkUtils.fetchWithTimeout
          ) {
            response = await window.NetworkUtils.fetchWithTimeout(
              url,
              {},
              10000
            );
          } else {
            response = await fetch(url);
          }
        }

        if (!response.ok) {
          throw new Error(`Failed to load ${difficulty}.json: ${response.statusText}`);
        }

        const data = await response.json();
        wordLists[difficulty] = data;
        return { difficulty, success: true };
      } catch (error) {
        console.warn(`Failed to load ${difficulty}.json:`, error);
        return { difficulty, success: false, error };
      }
    });

    const results = await Promise.all(loadPromises);

    // Check if we got at least one difficulty loaded
    const successful = results.filter((r) => r.success);
    if (successful.length === 0) {
      throw new Error("Failed to load any word lists");
    }

    // Log any failures
    const failed = results.filter((r) => !r.success);
    if (failed.length > 0) {
      console.warn(
        `Failed to load ${failed.length} word list(s):`,
        failed.map((f) => f.difficulty).join(", ")
      );
    }

    return wordLists;
  }

  /**
   * Loads words for a specific difficulty
   * @param {string} difficulty - Difficulty level (easy, medium, hard)
   * @param {Function} fetchFn - Custom fetch function
   * @returns {Promise<Object>} Word lists for the difficulty
   */
  static async loadDifficultyWords(difficulty, fetchFn = null) {
    const url = `data/words/${difficulty}.json`;
    let response;

    if (fetchFn) {
      response = await fetchFn(url, {}, "words_" + difficulty);
    } else {
      if (
        typeof window !== "undefined" &&
        window.NetworkUtils &&
        window.NetworkUtils.fetchWithTimeout
      ) {
        response = await window.NetworkUtils.fetchWithTimeout(url, {}, 10000);
      } else {
        response = await fetch(url);
      }
    }

    if (!response.ok) {
      throw new Error(`Failed to load ${difficulty}.json: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Gets fallback word lists (for offline/error scenarios)
   * @returns {Object} Fallback word lists
   */
  static getFallbackWords() {
    return {
      easy: {
        animals: ["cat", "dog", "bird", "fish", "lion", "bear", "wolf", "deer"],
        colors: [
          "red",
          "blue",
          "green",
          "yellow",
          "black",
          "white",
          "pink",
          "purple",
        ],
        food: [
          "pizza",
          "cake",
          "soup",
          "rice",
          "meat",
          "milk",
          "bread",
          "cheese",
        ],
      },
      medium: {
        animals: [
          "elephant",
          "giraffe",
          "penguin",
          "dolphin",
          "tiger",
          "eagle",
          "shark",
          "butterfly",
        ],
        countries: [
          "france",
          "germany",
          "japan",
          "brazil",
          "canada",
          "australia",
          "italy",
          "spain",
        ],
        food: [
          "burger",
          "pasta",
          "salad",
          "sushi",
          "tacos",
          "curry",
          "pizza",
          "sandwich",
        ],
      },
      hard: {
        animals: [
          "rhinoceros",
          "hippopotamus",
          "orangutan",
          "chameleon",
          "platypus",
          "armadillo",
        ],
        science: [
          "photosynthesis",
          "metamorphosis",
          "chromosome",
          "molecule",
          "ecosystem",
          "laboratory",
        ],
        literature: [
          "shakespeare",
          "hemingway",
          "dickens",
          "tolkien",
          "austen",
          "twain",
        ],
      },
    };
  }
}

// Export for use in other files
if (typeof window !== "undefined") {
  window.WordLoader = WordLoader;
}

