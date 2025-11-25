# 01-hello-world (ESM)

Numflow Hello World - ES Modules version

## Quick Start

```bash
npm install
npm start
```

## Test

```bash
# GET /
curl http://localhost:3000/

# GET /json
curl http://localhost:3000/json
```

## Code

```javascript
import numflow from 'numflow'

const app = numflow()

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/json', (req, res) => {
  res.json({
    message: 'Hello Numflow!',
    framework: 'Numflow'
  })
})

app.listen(3000)
```

## ESM vs CJS

| ESM (This) | CJS |
|------------|-----|
| `import numflow from 'numflow'` | `const numflow = require('numflow')` |
| `export default app` | `module.exports = app` |
| `"type": "module"` in package.json | Default |
