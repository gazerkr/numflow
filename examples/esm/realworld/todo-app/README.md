# Todo App (ESM)

A real-world Todo API built with Numflow - ES Modules version

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /todos | List all todos |
| POST | /todos | Create a new todo |
| DELETE | /todos/:id | Delete a todo |

## Folder Structure

```
features/
└── todos/
    ├── @get/                    → GET /todos
    │   ├── index.js
    │   └── steps/
    │       ├── 100-fetch.js
    │       └── 200-respond.js
    ├── @post/                   → POST /todos
    │   ├── index.js
    │   └── steps/
    │       ├── 100-validate.js
    │       ├── 200-create.js
    │       └── 300-respond.js
    └── [id]/
        └── @delete/             → DELETE /todos/:id
            ├── index.js
            └── steps/
                ├── 100-delete.js
                └── 200-respond.js
```

## Quick Start

```bash
npm install
npm start
```

## Test

```bash
# List todos
curl http://localhost:3000/todos

# Create todo
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn Numflow"}'

# Delete todo
curl -X DELETE http://localhost:3000/todos/1
```

## ESM Import Syntax

```javascript
// db.js - Named exports
export function findAll() { ... }
export function create(data) { ... }
export default { findAll, create, ... }

// Step files
import db from '../../../../db.js'  // Note: .js extension required
```
