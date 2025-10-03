const http = require("http");
const fs = require("fs");
const path = require("path");

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

// Port configuration
const PORT = process.env.PORT || 3000;

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

  // Read and serve file
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === "ENOENT") {
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
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      // Success - serve file
      res.writeHead(200, { "Content-Type": mimeType });
      res.end(content, "utf-8");
    }
  });
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
