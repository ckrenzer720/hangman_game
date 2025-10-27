// ========================================
// HANGMAN GAME - HELP SYSTEM
// ========================================

class HelpSystem {
  constructor() {
    this.currentSection = 0;
    this.sections = [
      {
        id: "tutorial",
        title: "🎮 Interactive Tutorial",
        icon: "🎮",
        content: this.getTutorialContent(),
      },
      {
        id: "rules",
        title: "📖 Game Rules",
        icon: "📖",
        content: this.getRulesContent(),
      },
      {
        id: "shortcuts",
        title: "⌨️ Keyboard Shortcuts",
        icon: "⌨️",
        content: this.getShortcutsContent(),
      },
      {
        id: "tips",
        title: "💡 Tips & Strategies",
        icon: "💡",
        content: this.getTipsContent(),
      },
    ];
  }

  getTutorialContent() {
    return `
      <div class="help-section">
        <div class="tutorial-steps">
          <div class="step" data-step="1">
            <div class="step-number">1</div>
            <div class="step-content">
              <h3>Getting Started</h3>
              <p>Welcome to Hangman! The goal is to guess the hidden word letter by letter.</p>
              <div class="highlight-box">
                <strong>How to play:</strong> Click on letters or type them on your keyboard to make guesses.
              </div>
            </div>
          </div>

          <div class="step" data-step="2">
            <div class="step-number">2</div>
            <div class="step-content">
              <h3>Making Guesses</h3>
              <p>Each wrong guess will draw a part of the hangman figure. You have 6 incorrect guesses before the game is over.</p>
              <div class="highlight-box">
                <strong>Tip:</strong> Start with common letters like vowels (A, E, I, O, U) and common consonants (R, S, T, L, N).
              </div>
            </div>
          </div>

          <div class="step" data-step="3">
            <div class="step-number">3</div>
            <div class="step-content">
              <h3>Win Condition</h3>
              <p>You win by correctly guessing all letters in the word before making 6 incorrect guesses.</p>
              <div class="highlight-box">
                <strong>Victory!</strong> When you complete the word, you'll earn points based on your difficulty level and time.
              </div>
            </div>
          </div>

          <div class="step" data-step="4">
            <div class="step-number">4</div>
            <div class="step-content">
              <h3>Using Hints</h3>
              <p>If you're stuck, click the "Hint" button to reveal a random letter from the word.</p>
              <div class="highlight-box warning">
                <strong>Note:</strong> Hints reveal letters but don't affect your score. Use them wisely!
              </div>
            </div>
          </div>

          <div class="step" data-step="5">
            <div class="step-number">5</div>
            <div class="step-content">
              <h3>Difficulty Levels</h3>
              <p>Choose from Easy, Medium, or Hard difficulty levels. Harder levels offer higher point rewards!</p>
              <div class="highlight-box">
                <strong>Progress:</strong> As you win games, the difficulty automatically advances to challenge you more.
              </div>
            </div>
          </div>

          <div class="step" data-step="6">
            <div class="step-number">6</div>
            <div class="step-content">
              <h3>Track Your Progress</h3>
              <p>Check your statistics and achievements to see how you're improving over time.</p>
              <div class="highlight-box">
                <strong>Features:</strong> View detailed stats, unlock achievements, and challenge yourself to beat your best streaks!
              </div>
            </div>
          </div>
        </div>

        <div class="tutorial-actions">
          <button class="btn btn-secondary" onclick="helpSystem.highlightGameElements()">
            🎯 Highlight Game Elements
          </button>
        </div>
      </div>
    `;
  }

  getRulesContent() {
    return `
      <div class="help-section">
        <div class="rules-grid">
          <div class="rule-card">
            <div class="rule-icon">🎯</div>
            <h3>Objective</h3>
            <p>Guess the hidden word by selecting letters one at a time. Correct guesses reveal letters in the word, while incorrect guesses draw parts of the hangman figure.</p>
          </div>

          <div class="rule-card">
            <div class="rule-icon">❌</div>
            <h3>Losing</h3>
            <p>You lose the game if you make 6 incorrect guesses. The hangman figure will be completely drawn, and the correct word will be revealed.</p>
          </div>

          <div class="rule-card">
            <div class="rule-icon">✅</div>
            <h3>Winning</h3>
            <p>You win by guessing all letters in the word before using up all 6 incorrect guesses. Points are awarded based on difficulty, time, and efficiency.</p>
          </div>

          <div class="rule-card">
            <div class="rule-icon">🎮</div>
            <h3>Controls</h3>
            <p>Click on virtual keyboard letters or type on your physical keyboard. Press Space to pause/resume, Enter for new game, and H for a hint.</p>
          </div>

          <div class="rule-card">
            <div class="rule-icon">⭐</div>
            <h3>Scoring</h3>
            <p>Base score is 100 points, multiplied by difficulty (Easy: 1x, Medium: 2x, Hard: 3x). Bonuses are added for speed and accuracy.</p>
          </div>

          <div class="rule-card">
            <div class="rule-icon">🔥</div>
            <h3>Streaks</h3>
            <p>Consecutive wins build your streak. Longer streaks unlock achievements and push you to harder difficulty levels automatically.</p>
          </div>
        </div>
      </div>
    `;
  }

  getShortcutsContent() {
    return `
      <div class="help-section">
        <div class="shortcuts-grid">
          <div class="shortcut-category">
            <h3>🎮 Game Controls</h3>
            <div class="shortcut-list">
              <div class="shortcut-item">
                <div class="shortcut-keys">
                  <kbd>A</kbd><kbd>Z</kbd>
                </div>
                <div class="shortcut-description">
                  Guess a letter (any letter from A to Z)
                </div>
              </div>
              <div class="shortcut-item">
                <div class="shortcut-keys">
                  <kbd>Enter</kbd>
                </div>
                <div class="shortcut-description">
                  Start a new game
                </div>
              </div>
              <div class="shortcut-item">
                <div class="shortcut-keys">
                  <kbd>Space</kbd>
                </div>
                <div class="shortcut-description">
                  Pause/Resume the game
                </div>
              </div>
              <div class="shortcut-item">
                <div class="shortcut-keys">
                  <kbd>H</kbd>
                </div>
                <div class="shortcut-description">
                  Get a hint
                </div>
              </div>
            </div>
          </div>

          <div class="shortcut-category">
            <h3>📊 Navigation</h3>
            <div class="shortcut-list">
              <div class="shortcut-item">
                <div class="shortcut-keys">
                  <kbd>Esc</kbd>
                </div>
                <div class="shortcut-description">
                  Close modal windows
                </div>
              </div>
              <div class="shortcut-item">
                <div class="shortcut-keys">
                  <kbd>Click</kbd>
                </div>
                <div class="shortcut-description">
                  Click on virtual keyboard keys
                </div>
              </div>
              <div class="shortcut-item">
                <div class="shortcut-keys">
                  <kbd>Mouse Wheel</kbd>
                </div>
                <div class="shortcut-description">
                  Scroll through statistics and achievements
                </div>
              </div>
            </div>
          </div>

          <div class="shortcut-category">
            <h3>⚙️ Tips</h3>
            <div class="shortcut-list">
              <div class="shortcut-item info">
                <div class="shortcut-icon">💡</div>
                <div class="shortcut-description">
                  You can use either the virtual keyboard or your physical keyboard - both work the same!
                </div>
              </div>
              <div class="shortcut-item info">
                <div class="shortcut-icon">💡</div>
                <div class="shortcut-description">
                  Pausing won't stop your timer, but gives you time to think.
                </div>
              </div>
              <div class="shortcut-item info">
                <div class="shortcut-icon">💡</div>
                <div class="shortcut-description">
                  Invalid characters (numbers, symbols) are automatically filtered out.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  getTipsContent() {
    return `
      <div class="help-section">
        <div class="tips-grid">
          <div class="tip-card beginner">
            <div class="tip-header">
              <div class="tip-icon">🌱</div>
              <h3>Beginner Tips</h3>
            </div>
            <ul>
              <li>Start with common vowels: A, E, I, O, U</li>
              <li>Try frequent consonants: R, S, T, L, N</li>
              <li>Look for letter patterns in the word</li>
              <li>Use hints if you're stuck</li>
              <li>Start on Easy difficulty to learn</li>
            </ul>
          </div>

          <div class="tip-card advanced">
            <div class="tip-header">
              <div class="tip-icon">🏆</div>
              <h3>Advanced Strategies</h3>
            </div>
            <ul>
              <li>Think about common word patterns (e.g., -ing, -tion)</li>
              <li>Consider word length and common letter combinations</li>
              <li>Analyze category themes for context clues</li>
              <li>Save rare letters (Q, X, Z) for later guesses</li>
              <li>Track which letters you've already guessed</li>
            </ul>
          </div>

          <div class="tip-card scoring">
            <div class="tip-header">
              <div class="tip-icon">⭐</拖>
              <h3>Maximize Your Score</h3>
            </div>
            <ul>
              <li>Play on Hard difficulty for 3x point multiplier</li>
              <li>Complete games quickly for time bonuses</li>
              <li>Minimize incorrect guesses for efficiency bonuses</li>
              <li>Build winning streaks for achievement unlocks</li>
              <li>Practice regularly to improve your accuracy</li>
            </ul>
          </div>

          <div class="tip-card performance">
            <div class="tip-header">
              <div class="tip-icon">📈</div>
              <h3>Improve Performance</h3>
            </div>
            <ul>
              <li>Practice daily to build pattern recognition</li>
              <li>Review your statistics to identify weaknesses</li>
              <li>Play diverse categories to expand vocabulary</li>
              <li>Set personal goals (e.g., 10-game streak)</li>
              <li>Use the pause feature to think strategically</li>
            </ul>
          </div>

          <div class="tip-card achievements">
            <div class="tip-header">
              <div class="tip-icon">🎖️</div>
              <h3>Unlock Achievements</h3>
            </div>
            <ul>
              <li><strong>First Win:</strong> Win your first game</li>
              <li><strong>5-Game Streak:</strong> Win 5 games in a row</li>
              <li><strong>Perfect Game:</strong> Win with no incorrect guesses</li>
              <li><strong>Speed Demon:</strong> Complete a game in under 15 seconds</li>
              <li><strong>Difficulty Master:</strong> Win on Hard difficulty</li>
            </ul>
          </div>

          <div class="tip-card general">
            <div class="tip-header">
              <div class="tip-icon">🎯</div>
              <h3>General Advice</h3>
            </div>
            <ul>
              <li>Read the category carefully for context</li>
              <li>Don't panic - you have 6 guesses</li>
              <li>Learn from your mistakes</li>
              <li>Have fun and challenge yourself!</li>
              <li>Share your progress with friends</li>
            </ul>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    return `
      <div class="help-navigation">
        ${this.sections
          .map(
            (section, index) => `
          <button class="help-nav-button ${
            index === this.currentSection ? "active" : ""
          }" 
                  onclick="helpSystem.showSection(${index})">
            <span class="help-nav-icon">${section.icon}</span>
            <span class="help-nav-title">${section.title}</span>
          </button>
        `
          )
          .join("")}
      </div>

      <div class="help-section-content">
        ${this.sections[this.currentSection].content}
      </div>
    `;
  }

  showSection(index) {
    this.currentSection = index;
    const content = document.getElementById("help-content");
    if (content) {
      content.innerHTML = this.render();
    }
  }

  highlightGameElements() {
    // Create a visual guide highlighting key elements
    if (window.ui) {
      window.ui.showFeedback(
        "info",
        "Keep an eye on the virtual keyboard, word display, and hangman figure to track your progress!"
      );
    }
  }

  initialize() {
    this.showSection(0);
  }
}

// Export for use in other files
window.HelpSystem = HelpSystem;
