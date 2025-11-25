# 01. Hello World

Start with the simplest Numflow server

## 🎯 Learning Objectives

- Understand Numflow basics
- Write simple routes
- Handle JSON responses

## 📝 Code

```javascript
const numflow = require('numflow')
const app = numflow()

// Basic route
app.get('/', (req, res) => {
  res.send('Hello World!')
})

// JSON response
app.get('/json', (req, res) => {
  res.json({
    message: 'Hello Numflow!',
    framework: 'Numflow'
  })
})

// Start server
app.listen(3000, () => {
  console.log('Server running on http://localhost:3000')
})
```

## 🚀 How to Run

```bash
# Install dependencies
npm install

# Start server
npm start

# Run tests
npm test
```

## 🧪 Test

```bash
curl http://localhost:3000/
# Hello World!

curl http://localhost:3000/json
# {"message":"Hello Numflow!","framework":"Numflow"}
```

## 📌 Key Concepts

1. **numflow()**: Create app instance
2. **app.get()**: Define GET route
3. **res.send()**: Text response
4. **res.json()**: JSON response

## ➡️ Next Step

Same as Express, right? But **Numflow's real power is Convention over Configuration**!

👉 Next example: [02-convention-first](../02-convention-first/)
