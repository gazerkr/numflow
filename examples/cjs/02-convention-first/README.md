# 02. Convention over Configuration ⭐

**Numflow's core philosophy: Folder structure becomes your API!**

## 🎯 Learning Objectives

- Understand **Convention over Configuration**
- Auto-infer HTTP methods from folder structure
- Auto-infer paths from folder structure
- Auto-infer dynamic parameters
- **Build APIs without configuration**

---

## 💡 Core Concept

### Express way vs Numflow way

```javascript
// ❌ Express: Explicit configuration required
app.get('/users', (req, res) => { ... })
app.get('/users/:id', (req, res) => { ... })

// ✅ Numflow: Just create folders!
features/users/@get/           → GET /users
features/users/[id]/@get/      → GET /users/:id
```

---

## 📂 Folder Structure

```
features/
├── hello/
│   └── @get/                      ← GET /hello
│       ├── index.js               # numflow.feature({})
│       └── steps/
│           └── 100-respond.js
├── users/
│   ├── @get/                      ← GET /users
│   │   ├── index.js
│   │   └── steps/
│   │       └── 100-respond.js
│   └── [id]/                      ← Dynamic parameter!
│       └── @get/                  ← GET /users/:id
│           ├── index.js
│           └── steps/
│               └── 100-respond.js
```

### 🔍 Convention Rules

| Folder Name | Auto-inferred Result |
|-------------|---------------------|
| `@get` | `method: 'GET'` |
| `@post` | `method: 'POST'` |
| `@put` | `method: 'PUT'` |
| `@delete` | `method: 'DELETE'` |
| `@patch` | `method: 'PATCH'` |
| `[id]` | `:id` (dynamic parameter) |
| `features/users/` | `path: '/users'` |
| `features/api/v1/users/` | `path: '/api/v1/users'` |
| `steps/` | Auto-detected |
| `async-tasks/` | Auto-detected |

---

## 📝 Code Examples

### 1. GET /hello

**File structure:**
```
features/hello/@get/
├── index.js
└── steps/
    └── 100-respond.js
```

**index.js** - Empty object is enough!
```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  // ⭐ Everything auto-inferred!
  // method: 'GET' ← from @get folder
  // path: '/hello' ← from features/hello/
  // steps: './steps' ← from steps/ folder
})
```

**steps/100-respond.js** - Simple response
```javascript
module.exports = async (ctx, req, res) => {
  res.json({
    message: 'Hello from Convention!'
  })
}
```

---

### 2. GET /users

**File structure:**
```
features/users/@get/
├── index.js
└── steps/
    └── 100-respond.js
```

**index.js**
```javascript
const numflow = require('numflow')

module.exports = numflow.feature({})  // ← Empty object!
```

**steps/100-respond.js**
```javascript
module.exports = async (ctx, req, res) => {
  const users = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Charlie' }
  ]

  res.json({ users })
}
```

---

### 3. GET /users/:id (Dynamic Parameter)

**File structure:**
```
features/users/[id]/@get/
├── index.js
└── steps/
    └── 100-respond.js
```

**index.js**
```javascript
const numflow = require('numflow')

module.exports = numflow.feature({})
// path: '/users/:id' ← [id] auto-converted!
```

**steps/100-respond.js**
```javascript
module.exports = async (ctx, req, res) => {
  const userId = req.params.id  // ← Same as Express!

  res.json({
    id: userId,
    name: `User ${userId}`
  })
}
```

---

## 🚀 How to Run

```bash
# Install dependencies
npm install

# Start server
npm start

# Run tests
npm test
```

---

## 🧪 Test

```bash
# GET /hello
curl http://localhost:3000/hello
# {"message":"Hello from Convention!"}

# GET /users
curl http://localhost:3000/users
# {"users":[{"id":"1","name":"Alice"},...]}

# GET /users/:id
curl http://localhost:3000/users/123
# {"id":"123","name":"User 123"}
```

---

## 🎨 Benefits of Convention

### 1. **Less Code**

```javascript
// ❌ Express: 5 lines
const express = require('express')
const app = express()
app.get('/users', (req, res) => { ... })

// ✅ Numflow: 1 line
module.exports = require('numflow').feature({})
```

### 2. **Consistent Structure**

All team members use the same folder structure → Easy code reviews

### 3. **IDE Autocomplete Support**

Folder structure → Clear paths → Prevent typos

### 4. **Easy Testing**

Folder structure = API → Clear test file locations

---

## 🔥 Core Message

> **"Just create folders, get APIs!"**
>
> Numflow analyzes folder structure to automatically infer:
> - HTTP method (method)
> - API path (path)
> - Step files (steps)
> - AsyncTask files (async-tasks)
>
> **Everything is auto-inferred.**

---

## 📌 Key Concepts Summary

| Concept | Description |
|---------|-------------|
| `@get`, `@post` | HTTP method folders |
| `[id]`, `[slug]` | Dynamic parameter folders |
| `features/` | Root for all Features |
| `numflow.feature({})` | Empty object = everything auto! |
| `app.registerFeatures()` | Auto-register Features |

---

## ❓ FAQ

### Q1. Why folder name `@get`?

A: A plain `get/` folder could be confused with regular directories, so `@get` clearly indicates it's an HTTP method.

### Q2. Can I use multiple dynamic parameters?

A: Yes! `features/posts/[postId]/comments/[commentId]/@get/` → `/posts/:postId/comments/:commentId`

### Q3. Can I override Convention with manual config?

A: Yes! `numflow.feature({ method: 'POST', path: '/custom' })` works. But **Convention is recommended**.

---

## ➡️ Next Step

Understood Convention? Now learn the **Step System**!

Break complex business logic into small steps.

👉 Next example: [03-step-system](../03-step-system/)
