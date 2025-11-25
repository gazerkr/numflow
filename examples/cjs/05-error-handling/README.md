# 05. Error Handling & Retry

Error handling and automatic retry mechanism

## 🎯 Core Concept

**3-tier error handling**

```
1. Error occurs in Step
   ↓
2. Feature.onError() executes
   ├─ Return RETRY → Retry
   ├─ Send response → End
   └─ Do nothing → Go to Global Handler
   ↓
3. Global Error Handler (app.onError)
```

## 💡 Retry Mechanism

```javascript
onError: async (error, ctx, req, res) => {
  if (error.message === 'NETWORK_ERROR') {
    return numflow.retry({
      maxAttempts: 3,  // Max 3 attempts
      delay: 1000      // Wait 1 second
    })
  }
}
```

## 🚀 How to Run

```bash
npm start

curl -X POST http://localhost:3000/payments \
  -H "Content-Type: application/json" \
  -d '{"amount":100}'

# Check console for retry logs!
```

## ➡️ Next: [realworld/todo-app](../realworld/todo-app/)
