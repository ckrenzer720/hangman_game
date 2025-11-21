// ========================================
// MODAL MANAGER - HANGMAN GAME
// ========================================

/**
 * ModalManager - Centralized modal management utility
 * Consolidates repetitive modal show/hide patterns across the codebase
 */
class ModalManager {
  constructor() {
    this.openModals = new Set();
    this.escapeHandler = null;
    this.init();
  }

  /**
   * Initialize modal manager
   */
  init() {
    // Setup escape key handler
    this.escapeHandler = (e) => {
      if (e.key === 'Escape' && this.openModals.size > 0) {
        // Close the most recently opened modal
        const modals = Array.from(this.openModals);
        const lastModal = modals[modals.length - 1];
        if (lastModal) {
          this.hide(lastModal);
        }
      }
    };
    document.addEventListener('keydown', this.escapeHandler);
  }

  /**
   * Show modal
   * @param {string|HTMLElement} modalId - Modal element ID or element
   * @param {Object} options - Options
   * @param {boolean} options.lockBody - Lock body scroll (default: true)
   * @param {boolean} options.closeOnEscape - Close on Escape key (default: true)
   * @param {boolean} options.closeOnOverlay - Close on overlay click (default: false)
   * @param {Function} options.onShow - Callback when shown
   * @param {Function} options.onHide - Callback when hidden
   */
  show(modalId, options = {}) {
    const modal = typeof modalId === 'string' 
      ? document.getElementById(modalId) 
      : modalId;

    if (!modal) {
      console.warn(`Modal not found: ${modalId}`);
      return false;
    }

    const config = {
      lockBody: true,
      closeOnEscape: true,
      closeOnOverlay: false,
      ...options
    };

    // Add show class
    modal.classList.add('show');
    this.openModals.add(modal);

    // Lock body scroll
    if (config.lockBody) {
      document.body.style.overflow = 'hidden';
    }

    // Setup overlay click handler
    if (config.closeOnOverlay) {
      const overlayHandler = (e) => {
        if (e.target === modal) {
          this.hide(modal);
          modal.removeEventListener('click', overlayHandler);
        }
      };
      modal.addEventListener('click', overlayHandler);
    }

    // Focus first focusable element
    const firstFocusable = modal.querySelector(
      'input, button, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    if (firstFocusable) {
      setTimeout(() => firstFocusable.focus(), 100);
    }

    // Call onShow callback
    if (config.onShow) {
      config.onShow(modal);
    }

    // Announce to screen readers
    const ariaLabel = modal.getAttribute('aria-labelledby');
    if (ariaLabel) {
      const labelElement = document.getElementById(ariaLabel);
      if (labelElement && window.accessibilityManager) {
        window.accessibilityManager.announce(labelElement.textContent);
      }
    }

    return true;
  }

  /**
   * Hide modal
   * @param {string|HTMLElement} modalId - Modal element ID or element
   * @param {Object} options - Options
   * @param {Function} options.onHide - Callback when hidden
   */
  hide(modalId, options = {}) {
    const modal = typeof modalId === 'string' 
      ? document.getElementById(modalId) 
      : modalId;

    if (!modal) {
      console.warn(`Modal not found: ${modalId}`);
      return false;
    }

    // Remove show class
    modal.classList.remove('show');
    this.openModals.delete(modal);

    // Unlock body scroll if no other modals are open
    if (this.openModals.size === 0) {
      document.body.style.overflow = '';
    }

    // Call onHide callback
    if (options.onHide) {
      options.onHide(modal);
    }

    return true;
  }

  /**
   * Toggle modal visibility
   * @param {string|HTMLElement} modalId - Modal element ID or element
   * @param {Object} options - Options
   */
  toggle(modalId, options = {}) {
    const modal = typeof modalId === 'string' 
      ? document.getElementById(modalId) 
      : modalId;

    if (!modal) {
      return false;
    }

    if (modal.classList.contains('show')) {
      return this.hide(modal, options);
    } else {
      return this.show(modal, options);
    }
  }

  /**
   * Check if modal is open
   * @param {string|HTMLElement} modalId - Modal element ID or element
   * @returns {boolean}
   */
  isOpen(modalId) {
    const modal = typeof modalId === 'string' 
      ? document.getElementById(modalId) 
      : modalId;

    return modal?.classList.contains('show') || false;
  }

  /**
   * Hide all open modals
   */
  hideAll() {
    const modals = Array.from(this.openModals);
    modals.forEach(modal => this.hide(modal));
  }

  /**
   * Get all open modals
   * @returns {HTMLElement[]}
   */
  getOpenModals() {
    return Array.from(this.openModals);
  }

  /**
   * Cleanup - remove event listeners
   */
  destroy() {
    if (this.escapeHandler) {
      document.removeEventListener('keydown', this.escapeHandler);
    }
    this.hideAll();
    this.openModals.clear();
  }
}

// Create singleton instance
const modalManager = new ModalManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ModalManager, modalManager };
}

