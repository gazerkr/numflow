# 04-async-tasks (ESM)

Numflow AsyncTask - ES Modules version

## Concept

Tasks that run in the background **after** the response is sent.

```
POST /users
    ↓
Steps execute (100 → 200 → 300)
    ↓
Response sent to client  ← Client done here!
    ↓
AsyncTasks run in background:
  - send-email.js
  - update-analytics.js
```

## Folder Structure

```
features/users/@post/
├── index.js
├── steps/
│   ├── 100-validate.js
│   ├── 200-create.js
│   └── 300-respond.js
└── async-tasks/        ← Background tasks
    ├── send-email.js
    └── update-analytics.js
```

## Quick Start

```bash
npm install
npm start
```

## Test

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'

# Response comes immediately
# Watch console for AsyncTask logs (2-3 seconds later)
```

## Key Points

- AsyncTasks only receive `ctx` (no `req`, `res`)
- AsyncTask errors don't affect the response
- Perfect for: emails, notifications, analytics, logging
