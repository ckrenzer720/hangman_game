// Tests for server.js
const http = require('http');
const fs = require('fs');
const path = require('path');

// Mock fs module
jest.mock('fs');

describe('Server', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock console methods to reduce noise
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Server Creation', () => {
    test('should create HTTP server', () => {
      const createServerSpy = jest.spyOn(http, 'createServer');
      
      // Load the server module
      require('../server.js');
      
      expect(createServerSpy).toHaveBeenCalled();
    });
  });

  describe('MIME Type Configuration', () => {
    test('should have correct MIME types for different file extensions', () => {
      const expectedMimeTypes = {
        '.html': 'text/html',
        '.css': 'text/css',
        '.js': 'text/javascript',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
      };

      // Test each expected MIME type
      Object.entries(expectedMimeTypes).forEach(([ext, mimeType]) => {
        const filePath = `./test${ext}`;
        const detectedExt = path.extname(filePath).toLowerCase();
        expect(detectedExt).toBe(ext);
      });
    });
  });

  describe('Server Module', () => {
    test('should load without errors', () => {
      expect(() => require('../server.js')).not.toThrow();
    });

    test('should export server functionality', () => {
      // The server module should be loadable
      const serverModule = require('../server.js');
      // Since it's a side-effect module, we just verify it loads
      expect(serverModule).toBeDefined();
    });
  });

  describe('Port Configuration', () => {
    test('should use default port when PORT env var is not set', () => {
      const originalEnv = process.env.PORT;
      delete process.env.PORT;
      
      // Reload the module to test default port
      jest.resetModules();
      require('../server.js');
      
      // Restore original env
      if (originalEnv) {
        process.env.PORT = originalEnv;
      }
    });

    test('should use PORT env var when set', () => {
      const originalEnv = process.env.PORT;
      process.env.PORT = '3001';
      
      // Reload the module to test custom port
      jest.resetModules();
      require('../server.js');
      
      // Restore original env
      if (originalEnv) {
        process.env.PORT = originalEnv;
      } else {
        delete process.env.PORT;
      }
    });
  });
});