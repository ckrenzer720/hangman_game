// ========================================
// HANGMAN GAME - UTILITY FUNCTIONS
// ========================================

// Utility class for common game functions
class GameUtils {
  static generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  static shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  static formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  static saveToLocalStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Error saving to localStorage:", error);
      return false;
    }
  }

  static loadFromLocalStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      return defaultValue;
    }
  }

  static clearLocalStorage(key) {
    try {
      if (key) {
        localStorage.removeItem(key);
      } else {
        localStorage.clear();
      }
      return true;
    } catch (error) {
      console.error("Error clearing localStorage:", error);
      return false;
    }
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  static validateInput(input, type = "letter") {
    switch (type) {
      case "letter":
        return /^[a-zA-Z]$/.test(input);
      case "word":
        return /^[a-zA-Z\s]+$/.test(input);
      case "number":
        return /^\d+$/.test(input);
      default:
        return false;
    }
  }

  static sanitizeInput(input) {
    return input.toString().trim().toLowerCase();
  }

  static createElement(tag, className = "", textContent = "") {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (textContent) element.textContent = textContent;
    return element;
  }

  static addClass(element, className) {
    if (element && className) {
      element.classList.add(className);
    }
  }

  static removeClass(element, className) {
    if (element && className) {
      element.classList.remove(className);
    }
  }

  static toggleClass(element, className) {
    if (element && className) {
      element.classList.toggle(className);
    }
  }

  static hasClass(element, className) {
    return element && element.classList.contains(className);
  }

  static getElement(selector) {
    return document.querySelector(selector);
  }

  static getElements(selector) {
    return document.querySelectorAll(selector);
  }

  static addEvent(element, event, handler) {
    if (element && event && handler) {
      element.addEventListener(event, handler);
    }
  }

  static removeEvent(element, event, handler) {
    if (element && event && handler) {
      element.removeEventListener(event, handler);
    }
  }

  static showElement(element) {
    if (element) {
      element.style.display = "block";
      element.classList.remove("hidden");
    }
  }

  static hideElement(element) {
    if (element) {
      element.style.display = "none";
      element.classList.add("hidden");
    }
  }

  static fadeIn(element, duration = 300) {
    if (element) {
      element.style.opacity = "0";
      element.style.display = "block";

      let start = performance.now();

      function animate(time) {
        let progress = (time - start) / duration;
        if (progress > 1) progress = 1;

        element.style.opacity = progress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      }

      requestAnimationFrame(animate);
    }
  }

  static fadeOut(element, duration = 300) {
    if (element) {
      let start = performance.now();

      function animate(time) {
        let progress = (time - start) / duration;
        if (progress > 1) progress = 1;

        element.style.opacity = 1 - progress;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          element.style.display = "none";
        }
      }

      requestAnimationFrame(animate);
    }
  }

  static animateElement(element, animation, duration = 500) {
    if (element) {
      element.style.animation = `${animation} ${duration}ms ease-in-out`;

      setTimeout(() => {
        element.style.animation = "";
      }, duration);
    }
  }

  static playSound(soundName) {
    // Placeholder for sound functionality
    console.log(`Playing sound: ${soundName}`);
  }

  static vibrate(pattern = [100]) {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }

  static isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  static isTouchDevice() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }

  static getScreenSize() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  }

  static isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  static scrollToElement(element, offset = 0) {
    if (element) {
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  }
}

// Export for use in other files
window.GameUtils = GameUtils;
