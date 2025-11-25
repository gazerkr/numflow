# 04. Async Tasks

Background tasks after response

## 🎯 Core Concept

**AsyncTasks run in the background, independent of the response.**

```
Steps complete → Send response (Client receives immediately)
                 ↓
            AsyncTask runs (background)
```

## 📂 Folder Structure

```
features/users/@post/
├── steps/                      # Sync execution (before response)
│   ├── 100-validate.js
│   ├── 200-create.js
│   └── 300-respond.js          ← Response sent here!
└── async-tasks/                # Async execution (after response)
    ├── send-email.js           ← Background
    └── update-analytics.js     ← Background
```

## 💡 AsyncTask vs Step

| | Step | AsyncTask |
|---|---|---|
| Execution timing | Before response | After response |
| Client wait | ✅ Waits | ❌ Doesn't wait |
| On failure | Affects response | Doesn't affect response |
| req, res access | ✅ Available | ❌ Not available (ctx only) |

## 🚀 How to Run

```bash
npm start

# Test
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

# Response received immediately!
# Check console for AsyncTask execution logs
```

## ➡️ Next: [05-error-handling](../05-error-handling/)
