# Numflow Examples

**The fastest way to learn Numflow!**

---

## 📁 Folder Structure

Examples are organized by module system:

```
examples/
├── cjs/                    # CommonJS (require/module.exports)
│   ├── 01-hello-world/
│   ├── 02-convention-first/
│   ├── 03-step-system/
│   ├── 04-async-tasks/
│   ├── 05-error-handling/
│   └── realworld/
│       ├── todo-app/       # REST API only
│       └── todo-app-ejs/   # Full-stack with EJS
│
└── esm/                    # ES Modules (import/export)
    ├── 01-hello-world/
    ├── 02-convention-first/
    ├── 03-step-system/
    ├── 04-async-tasks/
    ├── 05-error-handling/
    └── realworld/
        ├── todo-app/       # REST API only
        └── todo-app-ejs/   # Full-stack with EJS
```

**Choose your style:**
- **CJS**: Traditional Node.js style (`require()`)
- **ESM**: Modern JavaScript style (`import`)

---

## 🎯 Learning Path

Learn Numflow's core concepts step by step.

### 1️⃣ Hello World - 3 min

Start with the simplest server

**CJS:**
```javascript
const numflow = require('numflow')
const app = numflow()
app.get('/', (req, res) => res.send('Hello!'))
app.listen(3000)
```

**ESM:**
```javascript
import numflow from 'numflow'
const app = numflow()
app.get('/', (req, res) => res.send('Hello!'))
app.listen(3000)
```

**What you'll learn**: Express-compatible API

---

### 2️⃣ Convention First ⭐ - 10 min

**Numflow's core!** Folder structure becomes your API.

```
features/users/@get/      → GET /users
features/users/@post/     → POST /users
features/users/[id]/@get/ → GET /users/:id
```

**What you'll learn**: Convention over Configuration, automatic path inference

**💡 This is Numflow's most important differentiator!**

---

### 3️⃣ Step System - 15 min

Break complex logic into small steps

```
100-validate.js  → Validation
200-create.js    → Creation
300-respond.js   → Response
```

**What you'll learn**: Sequential step execution, Context sharing, early return

---

### 4️⃣ Async Tasks - 10 min

Background tasks after response

```
Steps complete → Send response (client receives immediately)
                 ↓
            AsyncTask runs (background)
```

**What you'll learn**: Non-blocking background tasks, eliminate response delays

---

### 5️⃣ Error Handling - 10 min

Error handling and automatic retry

```
Step error → Feature.onError → Retry or Global Handler
```

**What you'll learn**: 3-tier error handling, Retry mechanism

---

### 🌍 Realworld TODO App - 30 min

Complete TODO API and Full-stack implementations

#### todo-app (REST API)
```
GET    /todos      - List all
POST   /todos      - Create
DELETE /todos/:id  - Delete
```

#### todo-app-ejs (Full-stack with EJS)
```
GET    /           - Render TODO list page (EJS)
POST   /todos      - Create TODO
PUT    /todos/:id  - Toggle completion
DELETE /todos/:id  - Delete TODO
```

**What you'll learn**: All concepts integrated, production-ready project structure, EJS template rendering

---

## 📚 CJS vs ESM Comparison

| Aspect | CJS | ESM |
|--------|-----|-----|
| Import | `const numflow = require('numflow')` | `import numflow from 'numflow'` |
| Export | `module.exports = ...` | `export default ...` |
| package.json | Default | `"type": "module"` |
| File extension | `.js` | `.js` or `.mjs` |
| Step export | `module.exports = async (ctx, req, res) => {}` | `export default async (ctx, req, res) => {}` |

---

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/seunghyunpaek/numflow.git
cd numflow
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run an example

**CJS:**
```bash
cd examples/cjs/01-hello-world
npm install
npm start
```

**ESM:**
```bash
cd examples/esm/01-hello-world
npm install
npm start
```

---

## 💡 Core Message of Each Example

| Example | Core Message | Importance |
|---------|--------------|------------|
| 01-hello-world | "Start just like Express" | ⭐⭐ |
| 02-convention-first | **"Folders become APIs"** | ⭐⭐⭐⭐⭐ |
| 03-step-system | "Break logic into small steps" | ⭐⭐⭐⭐ |
| 04-async-tasks | "Background processing after response" | ⭐⭐⭐ |
| 05-error-handling | "Auto-retry and error handling" | ⭐⭐⭐ |
| realworld/todo-app | "Production-ready REST API" | ⭐⭐⭐⭐ |
| realworld/todo-app-ejs | "Full-stack with EJS template" | ⭐⭐⭐⭐ |

---

## 📚 Recommended Learning Paths

### For Beginners

```
01 → 02 ⭐ → realworld
```

At minimum, check out **02-convention-first**! This is Numflow's core.

### For Deep Learning

```
01 → 02 ⭐ → 03 → 04 → 05 → realworld
```

Complete all examples in order to master every Numflow concept.

---

## ❓ FAQ

### Q1. Should I use CJS or ESM?

**A**:
- **CJS**: If your existing project uses `require()`
- **ESM**: For new projects or if you prefer modern JavaScript

Both work identically with Numflow!

### Q2. How is it different from Express?

**A**: Numflow maintains Express compatibility while adding:
- ✅ **Convention over Configuration**: Auto-generate APIs from folder structure
- ✅ **Step System**: Break complex logic into small steps
- ✅ **AsyncTask**: Auto-schedule background tasks

### Q3. Which example should I start with?

**A**: At minimum, check out **01-hello-world** and **02-convention-first**. Example 02 is Numflow's core!

### Q4. Does it support TypeScript?

**A**: Yes! Numflow supports both JavaScript and TypeScript. However, examples prioritize JavaScript.

---

## 🔗 Additional Resources

- [📖 Official Documentation](../docs/)
- [🎯 API Reference](../docs/api/)
- [🏗️ Architecture](../docs/ARCHITECTURE.md)
- [🐛 GitHub Issues](https://github.com/seunghyunpaek/numflow/issues)

---

## 🎉 Next Steps

Completed all examples? Congratulations!

Now try:

1. ✅ Build your own API
2. ✅ Connect to a real database (PostgreSQL, MongoDB)
3. ✅ Add authentication/authorization
4. ✅ Deploy (Vercel, AWS, Docker)

**Happy Coding with Numflow!** 🚀
