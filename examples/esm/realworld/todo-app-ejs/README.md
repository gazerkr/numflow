# TODO App with EJS Template (ESM)

Full-stack TODO application using **Numflow Framework** with **EJS Template Engine**.

> **ESM Version** - Uses ES Modules (`import`/`export`)

## Features

- **Bulk Registration** - Register all Features with one line
- **Convention over Configuration** - Folder structure becomes API
- **EJS Template Engine** - Server-side rendering
- **Feature-First Pattern** - Step-based business logic
- **Full CRUD** - GET, POST, PUT, DELETE

## Project Structure

```
todo-app-ejs/
├── app.js                          # Main application
├── db.js                           # In-memory database
├── package.json
├── features/
│   ├── @get/                       # GET / - Render TODO list
│   │   ├── index.js
│   │   └── steps/
│   │       └── 100-render.js
│   └── todos/
│       ├── @post/                  # POST /todos - Add TODO
│       │   ├── index.js
│       │   └── steps/
│       │       ├── 100-validate.js
│       │       ├── 200-create-todo.js
│       │       └── 900-respond.js
│       └── [id]/
│           ├── @put/               # PUT /todos/:id - Toggle
│           │   ├── index.js
│           │   └── steps/
│           │       ├── 100-toggle-todo.js
│           │       └── 900-respond.js
│           └── @delete/            # DELETE /todos/:id
│               ├── index.js
│               └── steps/
│                   ├── 100-delete-todo.js
│                   └── 900-respond.js
├── views/
│   ├── index.ejs                   # Main template
│   └── error.ejs                   # Error template
└── public/
    └── style.css                   # Stylesheet
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Run Server

```bash
npm start
```

### Open in Browser

```
http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/` | Render TODO list page | HTML |
| POST | `/todos` | Add new TODO | JSON |
| PUT | `/todos/:id` | Toggle completion | JSON |
| DELETE | `/todos/:id` | Delete TODO | JSON |

## Key Concepts

### Convention over Configuration

Folder structure automatically becomes API:

| Folder Path | API Endpoint | HTTP Method |
|-------------|--------------|-------------|
| `features/@get/` | `/` | GET |
| `features/todos/@post/` | `/todos` | POST |
| `features/todos/[id]/@put/` | `/todos/:id` | PUT |
| `features/todos/[id]/@delete/` | `/todos/:id` | DELETE |

### EJS Template Rendering

```javascript
// features/@get/steps/100-render.js
export default async (ctx, req, res) => {
  res.render('index', {
    todos: ctx.todos
  })
}
```

### Step-based Business Logic

Steps execute sequentially in filename order:

```
100-validate.js  → Validate input
200-create.js    → Create TODO
900-respond.js   → Send response
```

## Package.json imports

Uses `#db` alias for clean imports:

```json
{
  "imports": {
    "#db": "./db.js"
  }
}
```

```javascript
import db from '#db'  // Instead of '../../../../db.js'
```

## Related Resources

- [Numflow Documentation](../../../../docs/)
- [Feature-First Guide](../../../../docs/en/getting-started/feature-first.md)
- [API Reference](../../../../docs/en/api/)
