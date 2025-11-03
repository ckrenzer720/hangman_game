// ========================================
// HANGMAN GAME - SHARE SYSTEM
// ========================================

class ShareSystem {
  constructor() {
    this.gameUrl = window.location.href.split('?')[0]; // Base URL without query params
  }

  /**
   * Shows the share modal with appropriate options
   * @param {Object} shareData - Data to share
   */
  showShareModal(shareData) {
    const modal = document.getElementById("share-modal");
    const content = document.getElementById("share-content");
    if (!modal || !content) return;

    let shareMessage = "";
    let shareTitle = "";

    // Generate share message based on type
    switch (shareData.type) {
      case "game_result":
        shareMessage = this.formatGameResultMessage(shareData);
        shareTitle = shareData.result === "won" ? "🎉 I Won a Game!" : "🎮 Hangman Game Result";
        break;
      case "achievements":
        shareMessage = this.formatAchievementsMessage(shareData);
        shareTitle = "🏆 My Achievements";
        break;
      case "multiplayer_result":
        shareMessage = this.formatMultiplayerMessage(shareData);
        shareTitle = "👥 Multiplayer Game Result";
        break;
      default:
        shareMessage = "I played Hangman!";
        shareTitle = "Hangman Game";
    }

    // Render share options
    content.innerHTML = this.renderShareOptions(shareData, shareMessage, shareTitle);
    
    modal.classList.add("show");
    document.body.style.overflow = "hidden";

    // Attach event listeners to share buttons
    this.attachShareEventListeners(shareData, shareMessage, shareTitle);
  }

  /**
   * Formats game result message
   * @param {Object} data - Game result data
   * @returns {string} - Formatted message
   */
  formatGameResultMessage(data) {
    if (data.result === "won") {
      return `🎉 I won a game of Hangman on ${data.difficulty} difficulty!\n\n` +
             `Word: ${data.word.toUpperCase()}\n` +
             `Score: ${data.score} points\n` +
             `Guesses: ${data.incorrectGuesses}/${data.maxIncorrectGuesses} incorrect\n\n` +
             `Play Hangman: ${this.gameUrl}`;
    } else {
      return `🎮 I played a game of Hangman on ${data.difficulty} difficulty.\n\n` +
             `The word was: ${data.word.toUpperCase()}\n` +
             `Score: ${data.score} points\n\n` +
             `Play Hangman: ${this.gameUrl}`;
    }
  }

  /**
   * Formats achievements message
   * @param {Object} data - Achievements data
   * @returns {string} - Formatted message
   */
  formatAchievementsMessage(data) {
    const achievementList = data.achievements.length > 0
      ? data.achievements.join(", ")
      : "No achievements yet";

    return `🏆 My Hangman Achievements:\n\n` +
           `${data.unlockedCount}/${data.totalAchievements} unlocked\n\n` +
           `Achievements: ${achievementList}\n\n` +
           `Play Hangman: ${this.gameUrl}`;
  }

  /**
   * Formats multiplayer result message
   * @param {Object} data - Multiplayer result data
   * @returns {string} - Formatted message
   */
  formatMultiplayerMessage(data) {
    const winner = data.winner;
    const playerList = data.players.map((p, idx) => 
      `${idx + 1}. ${p.name}: ${p.score} pts (${p.wins} wins)`
    ).join("\n");

    return `👥 Multiplayer Hangman Game Results:\n\n` +
           `🏆 Winner: ${winner.name} with ${winner.score} points!\n\n` +
           `Final Scores:\n${playerList}\n\n` +
           `Play Hangman: ${this.gameUrl}`;
  }

  /**
   * Renders share options UI
   * @param {Object} shareData - Share data
   * @param {string} message - Share message
   * @param {string} title - Share title
   * @returns {string} - HTML content
   */
  renderShareOptions(shareData, message, title) {
    return `
      <div class="share-preview">
        <h3>${title}</h3>
        <div class="share-message-preview">
          <textarea id="share-message-text" readonly rows="6" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; font-size: 14px;">${message}</textarea>
          <button class="btn btn-secondary" id="copy-message-btn" style="margin-top: 10px; width: 100%;">📋 Copy Message</button>
        </div>
      </div>

      <div class="share-options">
        <h4>Share via:</h4>
        <div class="share-buttons-grid">
          <button class="btn btn-share-social twitter" data-platform="twitter" title="Share on Twitter">
            <span class="share-icon">🐦</span>
            <span>Twitter</span>
          </button>
          <button class="btn btn-share-social facebook" data-platform="facebook" title="Share on Facebook">
            <span class="share-icon">📘</span>
            <span>Facebook</span>
          </button>
          <button class="btn btn-share-social reddit" data-platform="reddit" title="Share on Reddit">
            <span class="share-icon">🤖</span>
            <span>Reddit</span>
          </button>
          <button class="btn btn-share-social whatsapp" data-platform="whatsapp" title="Share on WhatsApp">
            <span class="share-icon">💬</span>
            <span>WhatsApp</span>
          </button>
          <button class="btn btn-share-social email" data-platform="email" title="Share via Email">
            <span class="share-icon">📧</span>
            <span>Email</span>
          </button>
          <button class="btn btn-share-social clipboard" data-platform="clipboard" title="Copy Link">
            <span class="share-icon">🔗</span>
            <span>Copy Link</span>
          </button>
        </div>
      </div>

      <div class="share-options" style="margin-top: 20px;">
        <h4>Or capture screenshot:</h4>
        <button class="btn btn-primary" id="capture-screenshot-btn" style="width: 100%;">
          📸 Capture Screenshot
        </button>
        <small style="display: block; margin-top: 10px; color: #666;">
          Capture the current game screen and download it as an image
        </small>
      </div>
    `;
  }

  /**
   * Attaches event listeners to share buttons
   * @param {Object} shareData - Share data
   * @param {string} message - Share message
   * @param {string} title - Share title
   */
  attachShareEventListeners(shareData, message, title) {
    // Copy message button
    const copyMessageBtn = document.getElementById("copy-message-btn");
    if (copyMessageBtn) {
      copyMessageBtn.addEventListener("click", () => {
        const textarea = document.getElementById("share-message-text");
        if (textarea) {
          textarea.select();
          textarea.setSelectionRange(0, 99999); // For mobile devices
          try {
            document.execCommand("copy");
            copyMessageBtn.textContent = "✓ Copied!";
            copyMessageBtn.style.background = "#4CAF50";
            setTimeout(() => {
              copyMessageBtn.textContent = "📋 Copy Message";
              copyMessageBtn.style.background = "";
            }, 2000);
          } catch (err) {
            // Fallback for modern browsers
            navigator.clipboard.writeText(message).then(() => {
              copyMessageBtn.textContent = "✓ Copied!";
              copyMessageBtn.style.background = "#4CAF50";
              setTimeout(() => {
                copyMessageBtn.textContent = "📋 Copy Message";
                copyMessageBtn.style.background = "";
              }, 2000);
            });
          }
        }
      });
    }

    // Social media share buttons
    const shareButtons = document.querySelectorAll("[data-platform]");
    shareButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const platform = btn.getAttribute("data-platform");
        this.shareToPlatform(platform, message, title);
      });
    });

    // Screenshot capture button
    const screenshotBtn = document.getElementById("capture-screenshot-btn");
    if (screenshotBtn) {
      screenshotBtn.addEventListener("click", () => {
        this.captureScreenshot(shareData);
      });
    }
  }

  /**
   * Shares to a specific platform
   * @param {string} platform - Platform name
   * @param {string} message - Message to share
   * @param {string} title - Share title
   */
  shareToPlatform(platform, message, title) {
    const encodedMessage = encodeURIComponent(message);
    const encodedUrl = encodeURIComponent(this.gameUrl);
    const encodedTitle = encodeURIComponent(title);

    let shareUrl = "";

    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedMessage}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedMessage}`;
        break;
      case "reddit":
        shareUrl = `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
        break;
      case "whatsapp":
        shareUrl = `https://wa.me/?text=${encodedMessage}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${encodedTitle}&body=${encodedMessage}`;
        break;
      case "clipboard":
        this.copyToClipboard(this.gameUrl);
        if (window.ui) {
          window.ui.showFeedback("success", "Link copied to clipboard!");
        }
        return;
      default:
        return;
    }

    // Open share URL in new window
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
    }
  }

  /**
   * Copies text to clipboard
   * @param {string} text - Text to copy
   */
  copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(err => {
        console.error("Failed to copy:", err);
        this.fallbackCopyToClipboard(text);
      });
    } else {
      this.fallbackCopyToClipboard(text);
    }
  }

  /**
   * Fallback clipboard copy method
   * @param {string} text - Text to copy
   */
  fallbackCopyToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand("copy");
      document.body.removeChild(textArea);
    } catch (err) {
      console.error("Fallback copy failed:", err);
      document.body.removeChild(textArea);
    }
  }

  /**
   * Captures a screenshot of the game
   * @param {Object} shareData - Share data for context
   */
  async captureScreenshot(shareData) {
    // Check if html2canvas is available (we'll add it as a script)
    if (typeof html2canvas === "undefined") {
      // Load html2canvas dynamically
      await this.loadHtml2Canvas();
    }

    try {
      const gameContainer = document.querySelector(".game-container");
      if (!gameContainer) {
        throw new Error("Game container not found");
      }

      // Show loading indicator
      const screenshotBtn = document.getElementById("capture-screenshot-btn");
      if (screenshotBtn) {
        screenshotBtn.textContent = "📸 Capturing...";
        screenshotBtn.disabled = true;
      }

      // Capture screenshot
      const canvas = await html2canvas(gameContainer, {
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
        scale: 1,
      });

      // Convert to blob and download
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `hangman-${shareData.type}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Reset button
        if (screenshotBtn) {
          screenshotBtn.textContent = "📸 Capture Screenshot";
          screenshotBtn.disabled = false;
        }

        if (window.ui) {
          window.ui.showFeedback("success", "Screenshot captured and downloaded!");
        }
      }, "image/png");
    } catch (error) {
      console.error("Screenshot capture failed:", error);
      if (window.ui) {
        window.ui.showFeedback("error", "Failed to capture screenshot. Please try again.");
      }
      
      const screenshotBtn = document.getElementById("capture-screenshot-btn");
      if (screenshotBtn) {
        screenshotBtn.textContent = "📸 Capture Screenshot";
        screenshotBtn.disabled = false;
      }
    }
  }

  /**
   * Loads html2canvas library dynamically
   * @returns {Promise} - Promise that resolves when loaded
   */
  loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (typeof html2canvas !== "undefined") {
        resolve();
        return;
      }

      // Check if script is already being loaded
      if (document.querySelector('script[src*="html2canvas"]')) {
        const checkInterval = setInterval(() => {
          if (typeof html2canvas !== "undefined") {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        return;
      }

      // Load html2canvas from CDN
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      script.crossOrigin = "anonymous";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load html2canvas"));
      document.head.appendChild(script);
    });
  }
}

// Export for use in other files
window.ShareSystem = ShareSystem;

