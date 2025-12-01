// ========================================
// KEYBOARD ACCESSIBILITY ENHANCER
// ========================================

/**
 * KeyboardAccessibilityEnhancer - Ensures 100% keyboard accessibility
 * Adds keyboard handlers to all interactive elements
 */
class KeyboardAccessibilityEnhancer {
  constructor() {
    this.focusTraps = new Map();
    this.init();
  }

  /**
   * Initialize keyboard accessibility enhancements
   */
  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupEnhancements());
    } else {
      this.setupEnhancements();
    }
  }

  /**
   * Setup all keyboard accessibility enhancements
   */
  setupEnhancements() {
    this.enhanceAllButtons();
    this.enhanceModals();
    this.enhanceFormControls();
    this.setupGlobalKeyboardHandlers();
  }

  /**
   * Enhance all buttons with keyboard support (Enter/Space)
   */
  enhanceAllButtons() {
    // Get all buttons
    const buttons = document.querySelectorAll('button, [role="button"]');
    
    buttons.forEach(button => {
      // Skip if already enhanced
      if (button.dataset.keyboardEnhanced === 'true') return;
      
      // Ensure button is focusable
      if (!button.hasAttribute('tabindex') && button.getAttribute('tabindex') !== '-1') {
        button.setAttribute('tabindex', '0');
      }
      
      // Add keyboard event handlers
      button.addEventListener('keydown', (e) => {
        // Enter or Space activates button
        if (e.key === 'Enter' || e.key === ' ') {
          // Prevent default space scroll
          if (e.key === ' ') {
            e.preventDefault();
          }
          
          // Only activate if not disabled
          if (!button.disabled && !button.hasAttribute('aria-disabled')) {
            button.click();
          }
        }
      });
      
      // Mark as enhanced
      button.dataset.keyboardEnhanced = 'true';
    });
  }

  /**
   * Enhance modals with proper focus trapping
   */
  enhanceModals() {
    const modals = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
    
    modals.forEach(modal => {
      this.setupModalFocusTrap(modal);
    });
    
    // Watch for dynamically added modals
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            if (node.matches && (node.matches('[role="dialog"]') || node.matches('.modal') || node.matches('[class*="modal"]'))) {
              this.setupModalFocusTrap(node);
            }
            // Check children
            const childModals = node.querySelectorAll && node.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
            if (childModals) {
              childModals.forEach(m => this.setupModalFocusTrap(m));
            }
          }
        });
      });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  }

  /**
   * Setup focus trap for a modal
   */
  setupModalFocusTrap(modal) {
    if (modal.dataset.focusTrapSetup === 'true') return;
    
    const getFocusableElements = () => {
      const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      return Array.from(modal.querySelectorAll(selector)).filter(el => {
        return !el.disabled && 
               el.offsetWidth > 0 && 
               el.offsetHeight > 0 &&
               window.getComputedStyle(el).visibility !== 'hidden';
      });
    };
    
    const trapFocus = (e) => {
      if (e.key !== 'Tab') return;
      
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    modal.addEventListener('keydown', trapFocus);
    modal.dataset.focusTrapSetup = 'true';
    
    // Store cleanup function
    this.focusTraps.set(modal, () => {
      modal.removeEventListener('keydown', trapFocus);
      delete modal.dataset.focusTrapSetup;
    });
  }

  /**
   * Enhance form controls
   */
  enhanceFormControls() {
    const inputs = document.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
      // Ensure proper tabindex
      if (!input.hasAttribute('tabindex') && !input.disabled) {
        input.setAttribute('tabindex', '0');
      }
      
      // Add Enter key handler for form submissions
      if (input.type === 'text' || input.type === 'email' || input.tagName === 'TEXTAREA') {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            // Find submit button in same form
            const form = input.closest('form');
            if (form) {
              const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
              if (submitBtn && !submitBtn.disabled) {
                e.preventDefault();
                submitBtn.click();
              }
            }
          }
        });
      }
    });
  }

  /**
   * Setup global keyboard handlers
   */
  setupGlobalKeyboardHandlers() {
    // Ensure main content is focusable for skip links
    const main = document.querySelector('main');
    if (main && !main.hasAttribute('tabindex')) {
      main.setAttribute('tabindex', '-1');
    }
    
    // Add Home/End key support for lists
    document.addEventListener('keydown', (e) => {
      const target = e.target;
      
      // Home key - focus first item
      if (e.key === 'Home' && !e.ctrlKey && !e.metaKey) {
        const container = target.closest('[role="list"], [role="listbox"], ul, ol');
        if (container) {
          const firstItem = container.querySelector('[role="listitem"], li, [tabindex="0"]');
          if (firstItem) {
            e.preventDefault();
            firstItem.focus();
          }
        }
      }
      
      // End key - focus last item
      if (e.key === 'End' && !e.ctrlKey && !e.metaKey) {
        const container = target.closest('[role="list"], [role="listbox"], ul, ol');
        if (container) {
          const items = container.querySelectorAll('[role="listitem"], li, [tabindex="0"]');
          if (items.length > 0) {
            e.preventDefault();
            items[items.length - 1].focus();
          }
        }
      }
    });
  }

  /**
   * Re-enhance elements (useful after dynamic content changes)
   */
  reEnhance() {
    this.enhanceAllButtons();
    this.enhanceFormControls();
  }

  /**
   * Cleanup
   */
  destroy() {
    this.focusTraps.forEach((cleanup, modal) => {
      cleanup();
    });
    this.focusTraps.clear();
  }
}

// Auto-initialize
if (typeof window !== 'undefined') {
  window.keyboardAccessibilityEnhancer = new KeyboardAccessibilityEnhancer();
}

