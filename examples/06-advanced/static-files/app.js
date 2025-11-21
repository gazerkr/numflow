/**
 * Numflow Static Files Example
 *
 * Example of serving static files using numflow.static() middleware.
 */

const numflow = require("numflow");
const path = require("path");

const app = numflow();

// ========================================
// 1. Basic Usage - Serve public directory
// ========================================
console.log("✅ Static file serving enabled: /public");
app.use(numflow.static(path.join(__dirname, "public")));

// Accessible files:
// http://localhost:3000/index.html
// http://localhost:3000/css/style.css
// http://localhost:3000/js/app.js
// http://localhost:3000/images/logo.svg

// ========================================
// 2. Virtual Path Prefix
// ========================================
console.log("✅ Virtual path prefix: /static");
app.use("/static", numflow.static(path.join(__dirname, "public")));

// Accessible files:
// http://localhost:3000/static/index.html
// http://localhost:3000/static/css/style.css

// ========================================
// 3. Cache Configuration (1 day)
// ========================================
console.log("✅ Cache configuration: 1 day");
app.use(
  "/cached",
  numflow.static(path.join(__dirname, "public"), {
    maxAge: "1d", // 1 day cache
    etag: true, // Enable ETag
  })
);

// ========================================
// 4. Multiple Static Directories
// ========================================
// Mount multiple directories and search in order
// (If not found in first directory, search next directory)

// Example: Also serve assets directory
// app.use(numflow.static(path.join(__dirname, 'assets')))

// ========================================
// 5. Dotfiles Configuration
// ========================================
app.use(
  "/secure",
  numflow.static(path.join(__dirname, "public"), {
    dotfiles: "deny", // Deny access to dotfiles like .htaccess
  })
);

// ========================================
// 6. Disable Index File
// ========================================
app.use(
  "/no-index",
  numflow.static(path.join(__dirname, "public"), {
    index: false, // Don't serve index.html automatically for directory access
  })
);

// ========================================
// API Routes (Higher priority if registered before static files)
// ========================================
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    message: "Static files server is running",
  });
});

// ========================================
// Root Path (When not served by static files)
// ========================================
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Numflow Static Files Example</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
        }
        h1 { color: #2c3e50; }
        .endpoint {
          background: #f8f9fa;
          padding: 15px;
          margin: 10px 0;
          border-radius: 5px;
          border-left: 4px solid #3498db;
        }
        code {
          background: #ecf0f1;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
        }
      </style>
    </head>
    <body>
      <h1>🚀 Numflow Static Files Example</h1>
      <p>Example demonstrating various static file serving methods.</p>

      <h2>📁 Available Endpoints</h2>

      <div class="endpoint">
        <h3>1. Basic Static Files</h3>
        <p><a href="/index.html" target="_blank">GET /index.html</a> - Main HTML page</p>
        <p><a href="/css/style.css" target="_blank">GET /css/style.css</a> - CSS file</p>
        <p><a href="/js/app.js" target="_blank">GET /js/app.js</a> - JavaScript file</p>
        <p><a href="/images/logo.svg" target="_blank">GET /images/logo.svg</a> - SVG image</p>
      </div>

      <div class="endpoint">
        <h3>2. Virtual Path Prefix (/static)</h3>
        <p><a href="/static/index.html" target="_blank">GET /static/index.html</a></p>
        <p><a href="/static/css/style.css" target="_blank">GET /static/css/style.css</a></p>
      </div>

      <div class="endpoint">
        <h3>3. Cache Enabled (/cached)</h3>
        <p><a href="/cached/index.html" target="_blank">GET /cached/index.html</a> - 1 day cache</p>
        <p>Check <code>Cache-Control</code> header in browser dev tools</p>
      </div>

      <div class="endpoint">
        <h3>4. Dotfiles Denied (/secure)</h3>
        <p><code>GET /secure/.htaccess</code> - 403 Forbidden response</p>
      </div>

      <div class="endpoint">
        <h3>5. Index File Disabled (/no-index)</h3>
        <p><code>GET /no-index/</code> - 404 (index.html not served automatically)</p>
      </div>

      <div class="endpoint">
        <h3>6. API Endpoints</h3>
        <p><a href="/api/health" target="_blank">GET /api/health</a> - Health check</p>
      </div>

      <h2>💡 Key Features</h2>
      <ul>
        <li>✅ Automatic MIME type detection (HTML, CSS, JS, images, etc.)</li>
        <li>✅ ETag support (304 Not Modified)</li>
        <li>✅ Cache-Control header configuration</li>
        <li>✅ Automatic index.html serving for directories</li>
        <li>✅ Path traversal attack protection</li>
        <li>✅ Dotfiles access control</li>
        <li>✅ File streaming (memory efficient)</li>
      </ul>

      <h2>📚 Learn More</h2>
      <p>
        <a href="https://github.com/your-username/numflow" target="_blank">Numflow Official Documentation</a>
      </p>
    </body>
    </html>
  `);
});

// ========================================
// 404 Handler
// ========================================
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>404 Not Found</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 50px;
        }
        h1 { color: #e74c3c; }
      </style>
    </head>
    <body>
      <h1>404 Not Found</h1>
      <p>The requested file <code>${req.url}</code> could not be found.</p>
      <p><a href="/">Back to Home</a></p>
    </body>
    </html>
  `);
});

// ========================================
// Start Server
// ========================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   Numflow Static Files Example                            ║
║                                                            ║
║   🚀 Server running on http://localhost:${PORT}           ║
║                                                            ║
║   📁 Static files served from:                            ║
║      /          → public/                                 ║
║      /static    → public/ (with prefix)                   ║
║      /cached    → public/ (1 day cache)                   ║
║      /secure    → public/ (no dotfiles)                   ║
║      /no-index  → public/ (no auto index)                 ║
║                                                            ║
║   📚 API endpoints:                                        ║
║      GET /api/health                                       ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
