# 03. Step System

Break complex business logic into small steps

## 🎯 Learning Objectives

- Understand the Step system
- Share data through Context
- Sequential step execution
- Early return (early response)

## 📂 Folder Structure

```
features/orders/@post/
├── index.js                    # Feature configuration
└── steps/
    ├── 100-validate.js         # Step 1: Validation
    ├── 200-create.js           # Step 2: Creation
    └── 300-respond.js          # Step 3: Response
```

## 🔄 Step Execution Flow

```
Request
  ↓
contextInitializer (Initialize Context)
  ↓
Step 100: validate (Input validation)
  ↓
Step 200: create (Create order)
  ↓
Step 300: respond (Send response)
  ↓
Response
```

## 💡 Core Concepts

### 1. Context Sharing

All Steps share the same `ctx` object.

```javascript
// Step 1
ctx.productId = '123'

// Step 2
const id = ctx.productId  // ← Value from Step 1
```

### 2. Sequential Execution

Steps execute in numeric order of filenames.

- `100-validate.js` → `200-create.js` → `300-respond.js`

### 3. Early Return

Calling `res.json()` in a Step skips remaining Steps.

```javascript
if (error) {
  res.status(400).json({ error: 'Bad Request' })
  return  // ← Next Steps won't execute!
}
```

## 🚀 How to Run

```bash
npm install
npm start

# Test
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"productId":"abc123","quantity":5}'
```

## ➡️ Next Step

Understood the Step system? Now learn **AsyncTask**!

👉 Next example: [04-async-tasks](../04-async-tasks/)
