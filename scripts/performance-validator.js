// ========================================
// PERFORMANCE VALIDATOR - HANGMAN GAME
// ========================================

/**
 * Performance Validator class for checking if performance metrics meet targets
 */
class PerformanceValidator {
  constructor(options = {}) {
    this.targets = {
      pageLoadTime: options.pageLoadTime || 2000, // 2 seconds
      timeToInteractive: options.timeToInteractive || 3000, // 3 seconds
      firstContentfulPaint: options.firstContentfulPaint || 1000, // 1 second
      largestContentfulPaint: options.largestContentfulPaint || 1500, // 1.5 seconds
    };
    this.enabled = options.enabled !== false;
    this.onViolation = options.onViolation || null;
  }

  /**
   * Validate page load performance
   * @returns {Object} Validation results
   */
  validate() {
    if (!this.enabled || !('performance' in window)) {
      return { valid: true, message: 'Performance validation disabled or not supported' };
    }

    const results = {
      valid: true,
      violations: [],
      metrics: {},
      recommendations: []
    };

    try {
      // Get performance metrics
      const timing = performance.timing;
      const navigation = performance.getEntriesByType('navigation')[0];
      
      // Calculate page load time
      const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
      results.metrics.pageLoadTime = pageLoadTime;

      // Check page load time
      if (pageLoadTime > this.targets.pageLoadTime) {
        results.valid = false;
        results.violations.push({
          metric: 'pageLoadTime',
          actual: pageLoadTime,
          target: this.targets.pageLoadTime,
          message: `Page load time (${pageLoadTime}ms) exceeds target (${this.targets.pageLoadTime}ms)`
        });
        results.recommendations.push('Optimize script loading, use defer/async');
        results.recommendations.push('Prefetch critical resources (words.json)');
        results.recommendations.push('Minify and compress JavaScript/CSS');
        results.recommendations.push('Consider code splitting for non-critical features');
      }

      // Get First Contentful Paint (if available)
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcp) {
        results.metrics.firstContentfulPaint = fcp.startTime;
        if (fcp.startTime > this.targets.firstContentfulPaint) {
          results.violations.push({
            metric: 'firstContentfulPaint',
            actual: fcp.startTime,
            target: this.targets.firstContentfulPaint,
            message: `First Contentful Paint (${fcp.startTime}ms) exceeds target (${this.targets.firstContentfulPaint}ms)`
          });
          results.recommendations.push('Inline critical CSS');
          results.recommendations.push('Optimize render-blocking resources');
        }
      }

      // Get Largest Contentful Paint (if available)
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            results.metrics.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
            
            if (results.metrics.largestContentfulPaint > this.targets.largestContentfulPaint) {
              results.violations.push({
                metric: 'largestContentfulPaint',
                actual: results.metrics.largestContentfulPaint,
                target: this.targets.largestContentfulPaint,
                message: `LCP (${results.metrics.largestContentfulPaint}ms) exceeds target (${this.targets.largestContentfulPaint}ms)`
              });
              results.recommendations.push('Optimize largest content element loading');
              results.recommendations.push('Preload critical images/fonts');
            }
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
          // LCP not supported
        }
      }

      // Get Time to Interactive (if available)
      if (navigation && navigation.interactive) {
        results.metrics.timeToInteractive = navigation.interactive;
        if (navigation.interactive > this.targets.timeToInteractive) {
          results.violations.push({
            metric: 'timeToInteractive',
            actual: navigation.interactive,
            target: this.targets.timeToInteractive,
            message: `TTI (${navigation.interactive}ms) exceeds target (${this.targets.timeToInteractive}ms)`
          });
          results.recommendations.push('Reduce JavaScript execution time');
          results.recommendations.push('Defer non-critical JavaScript');
        }
      }

      // Calculate resource loading times
      const resources = performance.getEntriesByType('resource');
      const scriptResources = resources.filter(r => r.initiatorType === 'script');
      const cssResources = resources.filter(r => r.initiatorType === 'css');
      
      results.metrics.totalResources = resources.length;
      results.metrics.scriptResources = scriptResources.length;
      results.metrics.cssResources = cssResources.length;

      // Check for slow resources
      const slowResources = resources.filter(r => r.duration > 500);
      if (slowResources.length > 0) {
        results.recommendations.push(`Optimize ${slowResources.length} slow-loading resources`);
        results.metrics.slowResources = slowResources.map(r => ({
          name: r.name,
          duration: r.duration
        }));
      }

      // Call violation handler if any violations found
      if (!results.valid && this.onViolation) {
        this.onViolation(results);
      }

      return results;
    } catch (error) {
      console.warn('[PerformanceValidator] Error validating performance:', error);
      return { valid: true, error: error.message };
    }
  }

  /**
   * Validate after page load
   */
  validateAfterLoad() {
    if (document.readyState === 'complete') {
      setTimeout(() => this.validate(), 100);
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => this.validate(), 100);
      });
    }
  }

  /**
   * Get performance report
   * @returns {Object} Performance report
   */
  getReport() {
    const validation = this.validate();
    return {
      targets: this.targets,
      validation: validation,
      timestamp: new Date().toISOString()
    };
  }
}

// Auto-validate on load if in browser
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      if (window.performanceMonitor) {
        const validator = new PerformanceValidator({
          enabled: true,
          onViolation: (results) => {
            console.warn('⚠️ Performance targets not met:', results);
            if (results.violations.length > 0) {
              console.group('Performance Violations');
              results.violations.forEach(v => {
                console.warn(`❌ ${v.message}`);
              });
              console.groupEnd();
              
              if (results.recommendations.length > 0) {
                console.group('Recommendations');
                results.recommendations.forEach(r => console.log(`💡 ${r}`));
                console.groupEnd();
              }
            }
          }
        });
        
        const report = validator.getReport();
        if (report.validation.valid) {
          console.log('✅ Performance targets met!', report.validation.metrics);
        }
        
        // Store validator globally for debugging
        if (window.location.search.includes('debug=true')) {
          window.performanceValidator = validator;
        }
      }
    }, 100);
  });
}

