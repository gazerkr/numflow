# Numflow Static Files Example

Example of serving static files using Numflow's `numflow.static()` middleware.

## 🎯 Key Features

- ⚡ **High-Performance File Serving** - Memory-efficient file streaming
- 🔒 **Security** - Automatic path traversal attack protection
- 📦 **Caching** - ETag and Cache-Control support
- 🎯 **Automatic MIME Types** - Content-Type auto-detection
- 📁 **Index Files** - Automatic index.html serving for directories
- 🚫 **Dotfiles Control** - Protection for .htaccess and similar files
- 🔄 **304 Not Modified** - Cache validation support

## 🚀 Getting Started

### 1. Start the Server

```bash
node app.js
```

### 2. Open in Browser

```
http://localhost:3000
```

## 📁 Project Structure

```
static-files/
├── app.js              # Main server file
├── package.json
├── README.md
└── public/             # Static files directory
    ├── index.html      # Main HTML page
    ├── css/
    │   └── style.css   # Stylesheet
    ├── js/
    │   └── app.js      # Client-side JavaScript
    └── images/
        └── logo.svg    # Logo image
```

## 📚 Usage Examples

### 1. Basic Usage

Serve static files in the simplest way:

```javascript
const numflow = require('numflow')
const app = numflow()

// Serve files from public directory at root path
app.use(numflow.static('public'))

app.listen(3000)
```

**Accessible URLs:**
- `http://localhost:3000/index.html`
- `http://localhost:3000/css/style.css`
- `http://localhost:3000/js/app.js`
- `http://localhost:3000/images/logo.svg`

### 2. Virtual Path Prefix

Mount static files under a specific path:

```javascript
app.use('/static', numflow.static('public'))
```

**Accessible URLs:**
- `http://localhost:3000/static/index.html`
- `http://localhost:3000/static/css/style.css`

### 3. Cache Configuration

Enable browser caching for better performance:

```javascript
app.use(numflow.static('public', {
  maxAge: '1d',  // 1 day cache
  etag: true,    // Enable ETag
}))
```

**Supported maxAge formats:**
- `'30s'` - 30 seconds
- `'5m'` - 5 minutes
- `'1h'` - 1 hour
- `'1d'` - 1 day
- `86400000` - milliseconds (1 day)

### 4. Multiple Directories

Search multiple directories in order:

```javascript
// Search assets directory first
app.use(numflow.static('assets'))

// Search public directory if not found
app.use(numflow.static('public'))
```

### 5. Dotfiles Access Control

Control access to hidden files:

```javascript
app.use(numflow.static('public', {
  dotfiles: 'deny',  // Deny access to .htaccess, etc.
}))
```

**Options:**
- `'allow'` - Allow all dotfiles
- `'deny'` - Return 403 Forbidden
- `'ignore'` - Return 404 Not Found (default)

### 6. Disable Index File

Disable automatic index.html serving for directories:

```javascript
app.use(numflow.static('public', {
  index: false,  // Disable directory listing
}))
```

Or specify a different filename:

```javascript
app.use(numflow.static('public', {
  index: 'home.html',  // Serve home.html instead of index.html
}))
```

## ⚙️ Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxAge` | `string \| number` | `0` | Cache duration (e.g., `'1d'`, `'2h'`, `3600000`) |
| `etag` | `boolean` | `true` | Enable ETag generation (304 Not Modified support) |
| `index` | `boolean \| string` | `true` | File to serve when accessing a directory (`'index.html'`) |
| `dotfiles` | `'allow' \| 'deny' \| 'ignore'` | `'ignore'` | Dotfiles access control |

## 🧪 Testing

Test the following URLs in your browser:

### Basic Static Files
- http://localhost:3000/index.html
- http://localhost:3000/css/style.css
- http://localhost:3000/js/app.js
- http://localhost:3000/images/logo.svg

### Virtual Path
- http://localhost:3000/static/index.html
- http://localhost:3000/static/css/style.css

### Cache Testing
- http://localhost:3000/cached/index.html
- Check `Cache-Control` header in browser dev tools
- Verify `304 Not Modified` response on second request

### Dotfiles Test
- http://localhost:3000/secure/.htaccess (403 Forbidden)

### API Endpoints
- http://localhost:3000/api/health

## 📊 Performance Features

### 1. File Streaming
Sends files without loading them entirely into memory:

```javascript
// Internal implementation
const stream = fs.createReadStream(filePath)
stream.pipe(res)
```

**Benefits:**
- Handle large files without memory overhead
- Fast time-to-first-byte

### 2. ETag Caching
Returns `304 Not Modified` when file hasn't changed:

```
First Request:
  → 200 OK (send full file)
  → ETag: "abc123..."

Second Request:
  → If-None-Match: "abc123..."
  → 304 Not Modified (no file transfer)
```

**Benefits:**
- Bandwidth savings
- Faster page load times

### 3. Automatic MIME Type Detection
Sets `Content-Type` automatically based on file extension:

| Extension | Content-Type |
|-----------|--------------|
| `.html` | `text/html` |
| `.css` | `text/css` |
| `.js` | `application/javascript` |
| `.json` | `application/json` |
| `.png` | `image/png` |
| `.svg` | `image/svg+xml` |
| `.pdf` | `application/pdf` |

## 🔒 Security Features

### 1. Path Traversal Protection
Automatically blocks malicious path access:

```
❌ GET /../../../etc/passwd  → Blocked
❌ GET /./../../secrets.txt  → Blocked
✅ GET /images/logo.svg      → Allowed
```

### 2. Dotfiles Protection
Control access to system files:

```
❌ GET /.htaccess    → 403 Forbidden (deny) / 404 Not Found (ignore)
❌ GET /.env         → Protected
✅ GET /normal.html  → Allowed
```

## 💡 Best Practices

### 1. API and Static Files Together

Register API routes first for higher priority:

```javascript
// ✅ Correct order
app.get('/api/users', handler)      // API first
app.use(numflow.static('public'))   // Static files second

// ❌ Wrong order
app.use(numflow.static('public'))   // Static files first
app.get('/api/users', handler)      // API might not execute
```

### 2. Production Environment

Use long cache times in production:

```javascript
const isDev = process.env.NODE_ENV === 'development'

app.use(numflow.static('public', {
  maxAge: isDev ? 0 : '7d',  // Dev: no cache, Prod: 7 days
  etag: true,
}))
```

### 3. CDN Integration

Serve static files from CDN, handle dynamic content on server:

```javascript
// Development: serve locally
if (process.env.NODE_ENV === 'development') {
  app.use('/assets', numflow.static('public'))
}

// Production: use CDN
// In HTML: <link href="https://cdn.example.com/css/style.css">
```

### 4. Fallback Handling

Support SPA routing with fallback to index.html:

```javascript
app.use(numflow.static('public'))

// Fallback all routes to index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})
```

## 🚀 Next Steps

1. **Add Compression**: Use `numflow.compression()` middleware
2. **CORS Configuration**: Allow static file access from other domains
3. **Security Headers**: Use Helmet middleware for enhanced security
4. **Logging**: Add Morgan middleware for request logging

## 📖 Related Documentation

- [Numflow Official Documentation](https://github.com/your-username/numflow)
- [Middleware Guide](../../docs/middleware.md)
- [Performance Optimization](../../docs/performance.md)

## 📄 License

MIT
