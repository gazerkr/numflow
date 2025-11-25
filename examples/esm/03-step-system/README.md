# 03-step-system (ESM)

Numflow Step System - ES Modules version

## Concept

Break complex business logic into small, manageable steps.

```
POST /orders
    ↓
Step 1: 100-validate.js  → Validate input
    ↓
Step 2: 200-create.js    → Create order
    ↓
Step 3: 300-respond.js   → Send response
```

## Context Flow

```javascript
// Step 1
ctx.productId = productId
ctx.quantity = quantity

// Step 2 (uses Step 1 data)
ctx.order = { productId: ctx.productId, ... }

// Step 3 (uses Step 2 data)
res.json({ order: ctx.order })
```

## Quick Start

```bash
npm install
npm start
```

## Test

```bash
# Success
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"productId": "PROD-001", "quantity": 2}'

# Validation Error
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"quantity": 2}'
```
