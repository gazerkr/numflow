# 02-convention-first (ESM)

Numflow Convention over Configuration - ES Modules version

## Folder Structure = API

```
features/
├── hello/
│   └── @get/              → GET /hello
│       ├── index.js
│       └── steps/
│           └── 100-respond.js
└── users/
    ├── @get/              → GET /users
    │   ├── index.js
    │   └── steps/
    │       └── 100-respond.js
    └── [id]/
        └── @get/          → GET /users/:id
            ├── index.js
            └── steps/
                └── 100-respond.js
```

## Quick Start

```bash
npm install
npm start
```

## Test

```bash
curl http://localhost:3000/hello
curl http://localhost:3000/users
curl http://localhost:3000/users/123
```

## ESM Syntax

```javascript
// index.js
import numflow from 'numflow'

export default numflow.feature({})

// steps/100-respond.js
export default async (ctx, req, res) => {
  res.json({ message: 'Hello!' })
}
```
