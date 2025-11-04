// ========================================
// PERFORMANCE MONITOR - HANGMAN GAME
// ========================================

/**
 * Performance Monitor class for tracking and reporting performance metrics
 */
class PerformanceMonitor {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.logToConsole = options.logToConsole !== false;
    this.trackMemory = options.trackMemory !== false;
    this.metrics = {
      pageLoad: {},
      scriptLoad: {},
      resourceLoad: {},
      renderMetrics: {},
      memoryUsage: [],
      customMetrics: {}
    };
    this.marks = new Map();
    this.measures = new Map();
    this.observers = [];
    
    if (this.enabled && 'performance' in window) {
      this.init();
    }
  }

  init() {
    // Track page load performance
    if (document.readyState === 'complete') {
      this.capturePageLoadMetrics();
    } else {
      window.addEventListener('load', () => this.capturePageLoadMetrics());
    }

    // Track memory usage if available
    if (this.trackMemory && 'memory' in performance) {
      this.startMemoryTracking();
    }

    // Track resource loading
    this.observeResourceLoading();

    // Track long tasks (blocking operations)
    if ('PerformanceObserver' in window) {
      this.observeLongTasks();
    }
  }

  /**
   * Mark a performance checkpoint
   * @param {string} name - Name of the mark
   */
  mark(name) {
    if (!this.enabled || !('performance' in window)) return;
    
    try {
      performance.mark(name);
      this.marks.set(name, performance.now());
      
      if (this.logToConsole) {
        console.log(`[Performance] Mark: ${name}`);
      }
    } catch (error) {
      console.warn(`[Performance] Failed to mark ${name}:`, error);
    }
  }

  /**
   * Measure time between two marks
   * @param {string} name - Name of the measure
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name
   */
  measure(name, startMark, endMark) {
    if (!this.enabled || !('performance' in window)) return;
    
    try {
      if (endMark) {
        performance.measure(name, startMark, endMark);
      } else {
        performance.measure(name, startMark);
      }
      
      const measure = performance.getEntriesByName(name, 'measure')[0];
      if (measure) {
        this.measures.set(name, {
          duration: measure.duration,
          startTime: measure.startTime,
          entryType: measure.entryType
        });
        
        if (this.logToConsole) {
          console.log(`[Performance] Measure: ${name} = ${measure.duration.toFixed(2)}ms`);
        }
      }
    } catch (error) {
      console.warn(`[Performance] Failed to measure ${name}:`, error);
    }
  }

  /**
   * Capture page load metrics
   */
  capturePageLoadMetrics() {
    if (!('performance' in window) || !performance.timing) return;

    try {
      const timing = performance.timing;
      const navigation = performance.getEntriesByType('navigation')[0];

      this.metrics.pageLoad = {
        // DNS lookup time
        dnsTime: timing.domainLookupEnd - timing.domainLookupStart,
        
        // TCP connection time
        tcpTime: timing.connectEnd - timing.connectStart,
        
        // Request time
        requestTime: timing.responseStart - timing.requestStart,
        
        // Response time
        responseTime: timing.responseEnd - timing.responseStart,
        
        // DOM processing time
        domProcessingTime: timing.domComplete - timing.domLoading,
        
        // DOM content loaded time
        domContentLoadedTime: timing.domContentLoadedEventEnd - timing.navigationStart,
        
        // Page load time
        pageLoadTime: timing.loadEventEnd - timing.navigationStart,
        
        // First paint (if available)
        firstPaint: this.getFirstPaint(),
        
        // Time to interactive (if available)
        timeToInteractive: navigation ? navigation.interactive : null
      };

      if (this.logToConsole) {
        console.log('[Performance] Page Load Metrics:', this.metrics.pageLoad);
      }
    } catch (error) {
      console.warn('[Performance] Failed to capture page load metrics:', error);
    }
  }

  /**
   * Get first paint time
   * @returns {number|null} First paint time in milliseconds
   */
  getFirstPaint() {
    try {
      const paintEntries = performance.getEntriesByType('paint');
      if (paintEntries.length > 0) {
        const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
        return firstPaint ? firstPaint.startTime : null;
      }
    } catch (error) {
      // First paint not available in all browsers
    }
    return null;
  }

  /**
   * Start tracking memory usage
   */
  startMemoryTracking() {
    if (!('memory' in performance)) return;

    const trackMemory = () => {
      try {
        const memory = performance.memory;
        const memoryData = {
          timestamp: performance.now(),
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usedMB: (memory.usedJSHeapSize / 1048576).toFixed(2),
          totalMB: (memory.totalJSHeapSize / 1048576).toFixed(2),
          limitMB: (memory.jsHeapSizeLimit / 1048576).toFixed(2)
        };

        this.metrics.memoryUsage.push(memoryData);

        // Keep only last 100 entries to prevent memory bloat
        if (this.metrics.memoryUsage.length > 100) {
          this.metrics.memoryUsage.shift();
        }

        if (this.logToConsole && this.metrics.memoryUsage.length % 10 === 0) {
          console.log('[Performance] Memory Usage:', memoryData);
        }
      } catch (error) {
        console.warn('[Performance] Failed to track memory:', error);
      }
    };

    // Track memory every 5 seconds
    this.memoryInterval = setInterval(trackMemory, 5000);
    
    // Initial memory snapshot
    trackMemory();
  }

  /**
   * Stop memory tracking
   */
  stopMemoryTracking() {
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
  }

  /**
   * Observe resource loading performance
   */
  observeResourceLoading() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.metrics.resourceLoad[entry.name] = {
              duration: entry.duration,
              transferSize: entry.transferSize,
              decodedBodySize: entry.decodedBodySize,
              encodedBodySize: entry.encodedBodySize,
              startTime: entry.startTime
            };
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('[Performance] Failed to observe resource loading:', error);
    }
  }

  /**
   * Observe long tasks (blocking operations)
   */
  observeLongTasks() {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Tasks longer than 50ms
            console.warn(`[Performance] Long task detected: ${entry.duration.toFixed(2)}ms`);
            
            if (!this.metrics.customMetrics.longTasks) {
              this.metrics.customMetrics.longTasks = [];
            }
            
            this.metrics.customMetrics.longTasks.push({
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            });
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (error) {
      // Long task observer not supported in all browsers
      console.debug('[Performance] Long task observer not available');
    }
  }

  /**
   * Track custom metric
   * @param {string} name - Metric name
   * @param {*} value - Metric value
   */
  trackMetric(name, value) {
    this.metrics.customMetrics[name] = value;
    
    if (this.logToConsole) {
      console.log(`[Performance] Metric: ${name} = ${value}`);
    }
  }

  /**
   * Get performance report
   * @returns {Object} Performance metrics report
   */
  getReport() {
    return {
      marks: Object.fromEntries(this.marks),
      measures: Object.fromEntries(this.measures),
      metrics: this.metrics,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Log performance report
   */
  logReport() {
    const report = this.getReport();
    console.group('📊 Performance Report');
    console.log('Page Load:', report.metrics.pageLoad);
    console.log('Marks:', report.marks);
    console.log('Measures:', report.measures);
    if (report.metrics.memoryUsage.length > 0) {
      const latestMemory = report.metrics.memoryUsage[report.metrics.memoryUsage.length - 1];
      console.log('Memory Usage:', latestMemory);
    }
    console.log('Custom Metrics:', report.metrics.customMetrics);
    console.groupEnd();
    
    return report;
  }

  /**
   * Get bundle size estimate (based on script tags)
   * @returns {Object} Bundle size information
   */
  getBundleSize() {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
    
    const scriptSizes = scripts.map(script => {
      const entry = performance.getEntriesByName(script.src, 'resource')[0];
      return {
        src: script.src,
        size: entry ? entry.transferSize : null,
        sizeKB: entry ? (entry.transferSize / 1024).toFixed(2) : null
      };
    });

    const stylesheetSizes = stylesheets.map(link => {
      const entry = performance.getEntriesByName(link.href, 'resource')[0];
      return {
        href: link.href,
        size: entry ? entry.transferSize : null,
        sizeKB: entry ? (entry.transferSize / 1024).toFixed(2) : null
      };
    });

    const totalScriptSize = scriptSizes.reduce((sum, s) => sum + (s.size || 0), 0);
    const totalStylesheetSize = stylesheetSizes.reduce((sum, s) => sum + (s.size || 0), 0);

    return {
      scripts: {
        count: scripts.length,
        totalSize: totalScriptSize,
        totalSizeKB: (totalScriptSize / 1024).toFixed(2),
        details: scriptSizes
      },
      stylesheets: {
        count: stylesheets.length,
        totalSize: totalStylesheetSize,
        totalSizeKB: (totalStylesheetSize / 1024).toFixed(2),
        details: stylesheetSizes
      },
      totalSize: totalScriptSize + totalStylesheetSize,
      totalSizeKB: ((totalScriptSize + totalStylesheetSize) / 1024).toFixed(2)
    };
  }

  /**
   * Clean up observers and intervals
   */
  cleanup() {
    this.stopMemoryTracking();
    
    this.observers.forEach(observer => {
      try {
        observer.disconnect();
      } catch (error) {
        // Ignore cleanup errors
      }
    });
    
    this.observers = [];
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceMonitor;
}

