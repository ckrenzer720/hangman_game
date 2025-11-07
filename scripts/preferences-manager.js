// ========================================
// PREFERENCES MANAGER - HANGMAN GAME
// ========================================

/**
 * PreferencesManager class for managing user preferences
 */
class PreferencesManager {
  constructor(options = {}) {
    this.cacheManager = options.cacheManager || null;
    this.defaultPreferences = {
      // Game settings
      difficulty: 'medium',
      category: 'animals',
      autoSave: true,
      autoSaveInterval: 30000, // 30 seconds
      
      // Display settings
      theme: 'light',
      fontSize: 'normal',
      highContrast: false,
      animations: true,
      
      // Audio settings
      sound: false,
      soundVolume: 0.5,
      
      // Gameplay settings
      hintsEnabled: true,
      showProgress: true,
      showTimer: false,
      difficultyProgression: true,
      
      // Accessibility
      keyboardNavigation: true,
      screenReader: false,
      
      // Privacy
      analytics: false,
      shareUsageData: false
    };
    
    this.preferences = { ...this.defaultPreferences };
    this.loadPreferences();
  }

  /**
   * Load preferences from storage
   */
  loadPreferences() {
    // Use cache manager if available
    if (this.cacheManager && this.cacheManager.isStorageAvailable()) {
      const cached = this.cacheManager.get('preferences');
      if (cached) {
        // Validate settings if validator available
        if (this.dataValidator) {
          const validation = this.dataValidator.validateSettings(cached);
          if (validation.recovered && validation.fixes.length > 0) {
            console.log('Preferences were automatically fixed:', validation.fixes);
            // Save fixed preferences
            this.cacheManager.set('preferences', cached);
          }
        }
        this.preferences = { ...this.defaultPreferences, ...cached };
        return;
      }
    }

    // Fallback to localStorage
    try {
      const saved = localStorage.getItem('hangman_preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.preferences = { ...this.defaultPreferences, ...parsed };
        
        // Migrate to cache manager if available
        if (this.cacheManager) {
          this.cacheManager.set('preferences', this.preferences);
        }
      }
    } catch (error) {
      console.warn('[PreferencesManager] Error loading preferences:', error);
      this.preferences = { ...this.defaultPreferences };
    }
  }

  /**
   * Save preferences to storage
   */
  savePreferences() {
    // Use cache manager if available
    if (this.cacheManager && this.cacheManager.isStorageAvailable()) {
      this.cacheManager.set('preferences', this.preferences, {
        metadata: {
          lastSaved: Date.now(),
          version: '1.0.0'
        }
      });
      return;
    }

    // Fallback to localStorage
    try {
      localStorage.setItem('hangman_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('[PreferencesManager] Error saving preferences:', error);
    }
  }

  /**
   * Get a preference value
   * @param {string} key - Preference key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Preference value
   */
  get(key, defaultValue = null) {
    return this.preferences.hasOwnProperty(key) 
      ? this.preferences[key] 
      : (defaultValue !== null ? defaultValue : this.defaultPreferences[key]);
  }

  /**
   * Set a preference value
   * @param {string} key - Preference key
   * @param {*} value - Value to set
   * @param {boolean} save - Whether to save immediately (default: true)
   */
  set(key, value, save = true) {
    if (this.preferences.hasOwnProperty(key) || this.defaultPreferences.hasOwnProperty(key)) {
      this.preferences[key] = value;
      if (save) {
        this.savePreferences();
      }
    } else {
      console.warn(`[PreferencesManager] Unknown preference key: ${key}`);
    }
  }

  /**
   * Set multiple preferences at once
   * @param {Object} prefs - Preferences object
   * @param {boolean} save - Whether to save immediately (default: true)
   */
  setMultiple(prefs, save = true) {
    Object.keys(prefs).forEach(key => {
      if (this.preferences.hasOwnProperty(key) || this.defaultPreferences.hasOwnProperty(key)) {
        this.preferences[key] = prefs[key];
      }
    });
    
    if (save) {
      this.savePreferences();
    }
  }

  /**
   * Reset preferences to defaults
   */
  reset() {
    this.preferences = { ...this.defaultPreferences };
    this.savePreferences();
  }

  /**
   * Get all preferences
   * @returns {Object} All preferences
   */
  getAll() {
    return { ...this.preferences };
  }

  /**
   * Export preferences for backup
   * @returns {Object} Exported preferences
   */
  export() {
    return {
      version: '1.0.0',
      timestamp: Date.now(),
      preferences: { ...this.preferences }
    };
  }

  /**
   * Import preferences from backup
   * @param {Object} backup - Backup data
   * @returns {boolean} True if successful
   */
  import(backup) {
    if (!backup || !backup.preferences) {
      return false;
    }

    try {
      // Merge with defaults to ensure all keys exist
      this.preferences = { ...this.defaultPreferences, ...backup.preferences };
      this.savePreferences();
      return true;
    } catch (error) {
      console.error('[PreferencesManager] Error importing preferences:', error);
      return false;
    }
  }

  /**
   * Validate preferences
   * @returns {Object} Validation result
   */
  validate() {
    // Use data validator if available
    if (this.dataValidator) {
      const validation = this.dataValidator.validateSettings(this.preferences);
      if (validation.recovered && validation.fixes.length > 0) {
        // Auto-save if preferences were fixed
        this.savePreferences();
      }
      return {
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings
      };
    }

    // Fallback to basic validation
    const errors = [];
    const warnings = [];

    // Validate theme
    const validThemes = ['light', 'dark', 'blue', 'green', 'purple', 'high-contrast'];
    if (!validThemes.includes(this.preferences.theme)) {
      errors.push(`Invalid theme: ${this.preferences.theme}`);
    }

    // Validate font size
    const validFontSizes = ['small', 'normal', 'large', 'extra-large'];
    if (!validFontSizes.includes(this.preferences.fontSize)) {
      errors.push(`Invalid font size: ${this.preferences.fontSize}`);
    }

    // Validate difficulty
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(this.preferences.difficulty)) {
      errors.push(`Invalid difficulty: ${this.preferences.difficulty}`);
    }

    // Validate volume
    if (typeof this.preferences.soundVolume !== 'number' || 
        this.preferences.soundVolume < 0 || 
        this.preferences.soundVolume > 1) {
      warnings.push('Sound volume should be between 0 and 1');
      this.preferences.soundVolume = Math.max(0, Math.min(1, this.preferences.soundVolume || 0.5));
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      warnings: warnings
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PreferencesManager;
}

