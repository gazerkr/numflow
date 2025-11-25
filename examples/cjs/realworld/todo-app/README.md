# Realworld TODO API

Complete TODO application example

## 🎯 What You'll Learn

- ✅ Convention over Configuration
- ✅ Step system
- ✅ Error handling
- ✅ CRUD API implementation
- ✅ Production-ready project structure

## 📂 Project Structure

```
todo-app/
├── db.js                        # In-memory database
├── app.js                       # App entry point
└── features/
    └── todos/
        ├── @get/                # GET /todos
        │   └── steps/
        │       ├── 100-fetch.js
        │       └── 200-respond.js
        ├── @post/               # POST /todos
        │   └── steps/
        │       ├── 100-validate.js
        │       ├── 200-create.js
        │       └── 300-respond.js
        └── [id]/
            └── @delete/         # DELETE /todos/:id
                └── steps/
                    ├── 100-delete.js
                    └── 200-respond.js
```

## 🚀 How to Run

```bash
npm install
npm start
```

## 🧪 API Tests

### 1. Create TODO

```bash
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Learn Numflow"}'

# Response: {"id":"1","title":"Learn Numflow","completed":false,...}
```

### 2. List All TODOs

```bash
curl http://localhost:3000/todos

# Response: {"todos":[...],"count":1}
```

### 3. Delete TODO

```bash
curl -X DELETE http://localhost:3000/todos/1

# Response: 204 No Content
```

## 💡 Key Points

### 1. APIs Auto-generated from Convention

```
features/todos/@get/          → GET /todos
features/todos/@post/         → POST /todos
features/todos/[id]/@delete/  → DELETE /todos/:id
```

### 2. Logic Separated into Steps

Each API is clearly separated into validation → processing → response stages.

### 3. Error Handling

- Input validation failure → 400 Bad Request
- Resource not found → 404 Not Found

## 📚 Next Steps

Expand this example:

- [ ] PUT /todos/:id (Update TODO)
- [ ] PATCH /todos/:id/complete (Mark complete)
- [ ] Connect to real database (PostgreSQL, MongoDB, etc.)
- [ ] Add user authentication
- [ ] Add notifications with AsyncTask

---

**Congratulations! You've mastered all of Numflow's core concepts!** 🎉
