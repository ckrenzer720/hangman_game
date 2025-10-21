// ========================================
// THEME MANAGER - HANGMAN GAME
// ========================================

class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.currentFontSize = 'normal';
    this.settings = {
      theme: 'light',
      fontSize: 'normal',
      highContrast: false,
      animations: true,
      sound: false
    };
    
    this.themes = {
      light: {
        name: 'Light',
        colors: {
          primary: '#2d2d2d',
          secondary: '#6b7280',
          background: '#faf9f7',
          text: '#2d2d2d'
        }
      },
      dark: {
        name: 'Dark',
        colors: {
          primary: '#e5e7eb',
          secondary: '#9ca3af',
          background: '#111827',
          text: '#e5e7eb'
        }
      },
      blue: {
        name: 'Blue',
        colors: {
          primary: '#1e40af',
          secondary: '#3b82f6',
          background: '#eff6ff',
          text: '#1e40af'
        }
      },
      green: {
        name: 'Green',
        colors: {
          primary: '#065f46',
          secondary: '#059669',
          background: '#f0fdf4',
          text: '#065f46'
        }
      },
      purple: {
        name: 'Purple',
        colors: {
          primary: '#7c3aed',
          secondary: '#8b5cf6',
          background: '#faf5ff',
          text: '#7c3aed'
        }
      },
      'high-contrast': {
        name: 'High Contrast',
        colors: {
          primary: '#000000',
          secondary: '#000000',
          background: '#ffffff',
          text: '#000000'
        }
      }
    };
    
    this.fontSizes = {
      small: { name: 'Small', multiplier: 0.875 },
      normal: { name: 'Normal', multiplier: 1 },
      large: { name: 'Large', multiplier: 1.125 },
      'extra-large': { name: 'Extra Large', multiplier: 1.25 }
    };
    
    this.init();
  }
  
  init() {
    this.loadSettings();
    this.applyTheme();
    this.applyFontSize();
    this.setupEventListeners();
  }
  
  loadSettings() {
    try {
      const savedSettings = localStorage.getItem('hangman-theme-settings');
      if (savedSettings) {
        this.settings = { ...this.settings, ...JSON.parse(savedSettings) };
        this.currentTheme = this.settings.theme;
        this.currentFontSize = this.settings.fontSize;
      }
    } catch (error) {
      console.warn('Failed to load theme settings:', error);
    }
  }
  
  saveSettings() {
    try {
      localStorage.setItem('hangman-theme-settings', JSON.stringify(this.settings));
    } catch (error) {
      console.warn('Failed to save theme settings:', error);
    }
  }
  
  setTheme(themeName) {
    if (this.themes[themeName]) {
      this.currentTheme = themeName;
      this.settings.theme = themeName;
      this.applyTheme();
      this.saveSettings();
      this.dispatchThemeChangeEvent();
    }
  }
  
  setFontSize(fontSize) {
    if (this.fontSizes[fontSize]) {
      this.currentFontSize = fontSize;
      this.settings.fontSize = fontSize;
      this.applyFontSize();
      this.saveSettings();
      this.dispatchThemeChangeEvent();
    }
  }
  
  setHighContrast(enabled) {
    this.settings.highContrast = enabled;
    if (enabled) {
      this.setTheme('high-contrast');
    } else {
      this.setTheme('light');
    }
    this.saveSettings();
    this.dispatchThemeChangeEvent();
  }
  
  setAnimations(enabled) {
    this.settings.animations = enabled;
    document.documentElement.style.setProperty('--transition-fast', enabled ? '0.2s ease' : '0s');
    document.documentElement.style.setProperty('--transition-normal', enabled ? '0.3s ease' : '0s');
    document.documentElement.style.setProperty('--transition-slow', enabled ? '0.5s ease' : '0s');
    this.saveSettings();
  }
  
  setSound(enabled) {
    this.settings.sound = enabled;
    this.saveSettings();
  }
  
  applyTheme() {
    const root = document.documentElement;
    root.setAttribute('data-theme', this.currentTheme);
    
    // Update theme preview colors
    this.updateThemePreviews();
  }
  
  applyFontSize() {
    const root = document.documentElement;
    root.setAttribute('data-font-size', this.currentFontSize);
  }
  
  updateThemePreviews() {
    const themeOptions = document.querySelectorAll('.theme-option');
    themeOptions.forEach(option => {
      const themeName = option.dataset.theme;
      const preview = option.querySelector('.theme-preview');
      if (preview && this.themes[themeName]) {
        const theme = this.themes[themeName];
        preview.style.background = theme.colors.background;
        preview.style.color = theme.colors.text;
        preview.style.border = `2px solid ${theme.colors.primary}`;
      }
    });
  }
  
  setupEventListeners() {
    // Theme selector
    document.addEventListener('click', (e) => {
      if (e.target.closest('.theme-option')) {
        const option = e.target.closest('.theme-option');
        const themeName = option.dataset.theme;
        if (themeName) {
          this.selectThemeOption(themeName);
          this.setTheme(themeName);
        }
      }
    });
    
    // Font size selector
    document.addEventListener('click', (e) => {
      if (e.target.closest('.font-size-option')) {
        const option = e.target.closest('.font-size-option');
        const fontSize = option.dataset.fontSize;
        if (fontSize) {
          this.selectFontSizeOption(fontSize);
          this.setFontSize(fontSize);
        }
      }
    });
    
    // High contrast toggle
    document.addEventListener('change', (e) => {
      if (e.target.id === 'high-contrast-toggle') {
        this.setHighContrast(e.target.checked);
      }
    });
    
    // Animations toggle
    document.addEventListener('change', (e) => {
      if (e.target.id === 'animations-toggle') {
        this.setAnimations(e.target.checked);
      }
    });
    
    // Sound toggle
    document.addEventListener('change', (e) => {
      if (e.target.id === 'sound-toggle') {
        this.setSound(e.target.checked);
      }
    });
  }
  
  selectThemeOption(themeName) {
    document.querySelectorAll('.theme-option').forEach(option => {
      option.classList.remove('selected');
    });
    const selectedOption = document.querySelector(`[data-theme="${themeName}"]`);
    if (selectedOption) {
      selectedOption.classList.add('selected');
    }
  }
  
  selectFontSizeOption(fontSize) {
    document.querySelectorAll('.font-size-option').forEach(option => {
      option.classList.remove('selected');
    });
    const selectedOption = document.querySelector(`[data-font-size="${fontSize}"]`);
    if (selectedOption) {
      selectedOption.classList.add('selected');
    }
  }
  
  createSettingsUI() {
    return `
      <div class="settings-section">
        <h3>Theme & Appearance</h3>
        
        <div class="setting-group">
          <label class="setting-label">Color Theme</label>
          <div class="setting-description">Choose your preferred color scheme</div>
          <div class="theme-selector">
            ${Object.entries(this.themes).map(([key, theme]) => `
              <div class="theme-option ${key === this.currentTheme ? 'selected' : ''}" data-theme="${key}">
                <div class="theme-preview" style="background: ${theme.colors.background}; color: ${theme.colors.text}; border: 2px solid ${theme.colors.primary};">
                  Aa
                </div>
                <div class="theme-name">${theme.name}</div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">Font Size</label>
          <div class="setting-description">Adjust text size for better readability</div>
          <div class="font-size-selector">
            ${Object.entries(this.fontSizes).map(([key, size]) => `
              <div class="font-size-option ${key === this.currentFontSize ? 'selected' : ''}" data-font-size="${key}">
                ${size.name}
              </div>
            `).join('')}
          </div>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">High Contrast Mode</label>
          <div class="setting-description">Increase contrast for better accessibility</div>
          <div class="setting-controls">
            <label class="toggle-switch">
              <input type="checkbox" id="high-contrast-toggle" ${this.settings.highContrast ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            <span>High Contrast</span>
          </div>
        </div>
      </div>
      
      <div class="settings-section">
        <h3>Preferences</h3>
        
        <div class="setting-group">
          <label class="setting-label">Animations</label>
          <div class="setting-description">Enable or disable visual animations</div>
          <div class="setting-controls">
            <label class="toggle-switch">
              <input type="checkbox" id="animations-toggle" ${this.settings.animations ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            <span>Enable Animations</span>
          </div>
        </div>
        
        <div class="setting-group">
          <label class="setting-label">Sound Effects</label>
          <div class="setting-description">Enable or disable audio feedback</div>
          <div class="setting-controls">
            <label class="toggle-switch">
              <input type="checkbox" id="sound-toggle" ${this.settings.sound ? 'checked' : ''}>
              <span class="toggle-slider"></span>
            </label>
            <span>Enable Sound</span>
          </div>
        </div>
      </div>
      
      <div class="settings-section">
        <h3>Preview</h3>
        <div class="settings-preview">
          <div class="preview-text">This is how the game will look with your current settings.</div>
          <div class="preview-buttons">
            <button class="preview-btn">Sample Button</button>
            <button class="preview-btn">Another Button</button>
          </div>
        </div>
      </div>
    `;
  }
  
  resetToDefault() {
    this.settings = {
      theme: 'light',
      fontSize: 'normal',
      highContrast: false,
      animations: true,
      sound: false
    };
    this.currentTheme = 'light';
    this.currentFontSize = 'normal';
    this.applyTheme();
    this.applyFontSize();
    this.saveSettings();
    this.dispatchThemeChangeEvent();
  }
  
  dispatchThemeChangeEvent() {
    const event = new CustomEvent('themeChanged', {
      detail: {
        theme: this.currentTheme,
        fontSize: this.currentFontSize,
        settings: this.settings
      }
    });
    document.dispatchEvent(event);
  }
  
  getCurrentSettings() {
    return { ...this.settings };
  }
  
  getAvailableThemes() {
    return { ...this.themes };
  }
  
  getAvailableFontSizes() {
    return { ...this.fontSizes };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ThemeManager;
} else {
  window.ThemeManager = ThemeManager;
}
