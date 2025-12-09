const http = require("http");
const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const crypto = require("crypto");

// MIME types for different file extensions
const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

// Cache control headers (in seconds)
const cacheControl = {
  ".html": 0, // No cache for HTML
  ".css": 86400, // 1 day for CSS
  ".js": 86400, // 1 day for JS
  ".json": 3600, // 1 hour for JSON
  ".png": 604800, // 7 days for images
  ".jpg": 604800,
  ".gif": 604800,
  ".svg": 604800,
  ".ico": 2592000, // 30 days for favicon
};

// Files that should be compressed
const compressibleTypes = [".html", ".css", ".js", ".json", ".svg"];

// Port configuration
const PORT = process.env.PORT || 3000;

// File cache for frequently accessed files
const fileCache = new Map();
const CACHE_MAX_SIZE = 50; // Maximum number of files to cache
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL

/**
 * Get file stats and content with caching
 */
function getCachedFile(filePath) {
  const cacheKey = filePath;
  const cached = fileCache.get(cacheKey);
  
  if (cached) {
    // Check if cache is still valid
    const now = Date.now();
    if (now - cached.timestamp < CACHE_TTL) {
      // Check if file hasn't been modified
      try {
        const stats = fs.statSync(filePath);
        if (stats.mtime.getTime() === cached.mtime) {
          return cached;
        }
      } catch (error) {
        // File might have been deleted, remove from cache
        fileCache.delete(cacheKey);
        return null;
      }
    }
    // Cache expired or file modified, remove it
    fileCache.delete(cacheKey);
  }
  
  // Read file and cache it
  try {
    const content = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);
    
    // Generate ETag from file content
    const hash = crypto.createHash('md5').update(content).digest('hex');
    const etag = `"${hash}"`;
    
    const fileData = {
      content,
      stats,
      mtime: stats.mtime.getTime(),
      timestamp: Date.now(),
      etag,
    };
    
    // Limit cache size
    if (fileCache.size >= CACHE_MAX_SIZE) {
      // Remove oldest entry
      const firstKey = fileCache.keys().next().value;
      fileCache.delete(firstKey);
    }
    
    fileCache.set(cacheKey, fileData);
    return fileData;
  } catch (error) {
    return null;
  }
}

// Helper function to compress content
function compressContent(content, encoding, callback) {
  if (encoding === "gzip") {
    zlib.gzip(content, callback);
  } else if (encoding === "deflate") {
    zlib.deflate(content, callback);
  } else if (encoding === "br") {
    zlib.brotliCompress(content, callback);
  } else {
    callback(null, content);
  }
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Parse URL and get file path
  let filePath = "." + req.url;

  // If root path, serve index.html
  if (filePath === "./") {
    filePath = "./index.html";
  }

  // Get file extension
  const extname = String(path.extname(filePath)).toLowerCase();
  const mimeType = mimeTypes[extname] || "application/octet-stream";
  const cacheMaxAge = cacheControl[extname] || 0;
  const shouldCompress = compressibleTypes.includes(extname);

  // Check if client accepts compression
  const acceptEncoding = req.headers["accept-encoding"] || "";
  const supportsGzip = acceptEncoding.includes("gzip");
  const supportsDeflate = acceptEncoding.includes("deflate");
  const supportsBrotli = acceptEncoding.includes("br");
  const encoding = supportsBrotli ? "br" : supportsGzip ? "gzip" : supportsDeflate ? "deflate" : null;

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    // File not found - serve 404 page
    res.writeHead(404, { "Content-Type": "text/html" });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>404 - File Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #e74c3c; }
            a { color: #3498db; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <h1>404 - File Not Found</h1>
          <p>The requested file could not be found.</p>
          <a href="/">← Back to Hangman Game</a>
        </body>
      </html>
    `);
    return;
  }

  // Get file from cache or read from disk
  const fileData = getCachedFile(filePath);
  
  if (!fileData) {
    // File read error
    res.writeHead(500);
    res.end(`Server Error: Unable to read file`);
    return;
  }

  const content = fileData.content;
  const etag = fileData.etag;

  // Check if client has cached version (304 Not Modified)
  const ifNoneMatch = req.headers["if-none-match"];
  if (ifNoneMatch === etag) {
    res.writeHead(304, {
      "ETag": etag,
      "Cache-Control": cacheMaxAge > 0 
        ? `public, max-age=${cacheMaxAge}` 
        : "no-cache, no-store, must-revalidate",
    });
    res.end();
    return;
  }

  // Prepare headers
  const headers = {
    "Content-Type": mimeType,
    "Cache-Control": cacheMaxAge > 0 
      ? `public, max-age=${cacheMaxAge}` 
      : "no-cache, no-store, must-revalidate",
    "ETag": etag,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
  };

  // Add compression headers if applicable
  if (shouldCompress && encoding) {
    headers["Content-Encoding"] = encoding;
    headers["Vary"] = "Accept-Encoding";
    
    // Compress content
    compressContent(content, encoding, (err, compressed) => {
      if (err) {
        // If compression fails, serve uncompressed
        res.writeHead(200, headers);
        res.end(content, "utf-8");
      } else {
        headers["Content-Length"] = compressed.length;
        res.writeHead(200, headers);
        res.end(compressed);
      }
    });
  } else {
    // Serve uncompressed
    res.writeHead(200, headers);
    res.end(content, "utf-8");
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`🎮 Hangman Game Server running at:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Network: http://0.0.0.0:${PORT}`);
  console.log(`\n📁 Serving files from: ${__dirname}`);
  console.log(`\n🚀 Open your browser and navigate to the URL above`);
  console.log(`\n💡 Press Ctrl+C to stop the server`);
});

// Handle server errors
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `❌ Port ${PORT} is already in use. Please try a different port.`
    );
    console.log(
      `💡 You can set a different port with: PORT=3001 node server.js`
    );
  } else {
    console.error("❌ Server error:", err);
  }
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n\n🛑 Shutting down server...");
  server.close(() => {
    console.log("✅ Server stopped successfully");
    process.exit(0);
  });
});
