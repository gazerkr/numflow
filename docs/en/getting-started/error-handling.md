# Error Handling

## Table of Contents

- [Level 1: Basics - Simple Error Handling](#level-1-basics---simple-error-handling)
- [Level 2: Intermediate - Numflow Built-in Error Types](#level-2-intermediate---numflow-built-in-error-types)
- [Level 3: Advanced - Custom Error Classes](#level-3-advanced---custom-error-classes)
- [Understanding Error Flow](#understanding-error-flow)
- [Error Utilities](#error-utilities)
- [Development vs Production](#development-vs-production)

---

## Level 1: Basics - Simple Error Handling

The most basic error handling. When you `throw new Error("...")`, it's automatically handled.

### 1.1 Basic Usage

```javascript
// Throwing an error in a Step
// features/api/users/@get/steps/100-fetch.js
module.exports = async (ctx, req, res) => {
  const user = await db.findUser(req.params.id)

  if (!user) {
    throw new Error('User not found')  // Simply throw an error
  }

  ctx.user = user
}
```

**Automatic Response (500 Internal Server Error):**
```json
{
  "error": {
    "message": "User not found",
    "statusCode": 500
  }
}
```

### 1.2 Feature's onError Handler

Handles errors only within that Feature. **Has access to ctx** for transaction rollback, etc.

```javascript
// features/api/orders/@post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  contextInitializer: async (ctx, req, res) => {
    ctx.transaction = await db.beginTransaction()
  },

  onError: async (error, ctx, req, res) => {
    console.log('Error occurred:', error.message)

    // Rollback transaction
    if (ctx.transaction) {
      await ctx.transaction.rollback()
    }

    // Send response directly
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }))
  }
})
```

### 1.3 app.onError() Global Handler

Handles errors from all routes and Features in one place.

```javascript
// app.js
const numflow = require('numflow')
const app = numflow()

// Global error handler
app.onError((err, req, res) => {
  console.error('Error:', err.message)

  res.status(500).json({
    success: false,
    error: err.message
  })
})

app.registerFeatures('./features')
app.listen(3000)
```

### 1.4 Using onError + app.onError() Together

```javascript
// features/api/orders/@post/index.js - cleanup only
module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // Only perform transaction rollback
    if (ctx.transaction) {
      await ctx.transaction.rollback()
    }

    // Delegate to global handler
    throw error
  }
})

// app.js - unified response handling
app.onError((err, req, res) => {
  res.status(500).json({
    success: false,
    error: err.message
  })
})
```

---

## Level 2: Intermediate - Numflow Built-in Error Types

Numflow provides error classes that match HTTP status codes.

### 2.1 Error Class List

```javascript
const {
  ValidationError,        // 400 - Validation error (validationErrors property)
  BusinessError,          // 400 - Business logic error (code property)
  UnauthorizedError,      // 401 - Authentication required
  ForbiddenError,         // 403 - Permission denied
  NotFoundError,          // 404 - Resource not found
  ConflictError,          // 409 - Conflict
  PayloadTooLargeError,   // 413 - Payload too large
  TooManyRequestsError,   // 429 - Rate limit exceeded (retryAfter property)
  InternalServerError,    // 500 - Server error
  NotImplementedError,    // 501 - Not implemented
  ServiceUnavailableError // 503 - Service unavailable
} = require('numflow')
```

### 2.2 Using in Steps

```javascript
// features/api/users/@post/steps/100-validate.js
const { ValidationError, ConflictError } = require('numflow')

module.exports = async (ctx, req, res) => {
  const { email, password } = req.body

  // Validation error - includes field-specific error messages
  const errors = {}
  if (!email?.includes('@')) {
    errors.email = ['Please enter a valid email']
  }
  if (!password || password.length < 8) {
    errors.password = ['Password must be at least 8 characters']
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('Validation failed', errors)
  }

  // Check for duplicates
  const exists = await db.findUserByEmail(email)
  if (exists) {
    throw new ConflictError('Email already in use')
  }

  ctx.validatedData = { email, password }
}
```

```javascript
// features/api/orders/@post/steps/200-check-stock.js
const { BusinessError } = require('numflow')

module.exports = async (ctx, req, res) => {
  const stock = await db.getStock(ctx.productId)

  if (stock < ctx.quantity) {
    throw new BusinessError('Out of stock', 'OUT_OF_STOCK')
  }

  ctx.stockChecked = true
}
```

### 2.3 Handling in Feature's onError

```javascript
// features/api/payments/@post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // Rollback transaction
    if (ctx.transaction) {
      await ctx.transaction.rollback()
    }

    // Branch handling by error code
    const code = error.code || error.originalError?.code

    switch (code) {
      case 'OUT_OF_STOCK':
        // Out of stock - release reservation
        await inventoryService.releaseReservation(ctx.reservationId)
        break

      case 'PAYMENT_DECLINED':
        // Log payment failure
        await logService.logPaymentFailure(ctx.paymentId, error)
        break
    }

    // Delegate to global handler
    throw error
  }
})
```

### 2.4 Handling in app.onError()

```javascript
// app.js
const numflow = require('numflow')
const { isHttpError } = numflow

const app = numflow()

app.onError((err, req, res) => {
  console.error('Error:', err.message)

  // Check with isHttpError() (duck typing - solves module instance issues)
  if (isHttpError(err)) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      // Include additional properties for each error type
      ...(err.validationErrors && { validationErrors: err.validationErrors }),
      ...(err.code && { code: err.code }),
      ...(err.retryAfter && { retryAfter: err.retryAfter })
    })
  }

  // Unknown error
  res.status(500).json({
    success: false,
    error: 'Internal Server Error'
  })
})
```

### 2.5 Response Examples

**ValidationError:**
```json
{
  "success": false,
  "error": "Validation failed",
  "validationErrors": {
    "email": ["Please enter a valid email"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

**BusinessError:**
```json
{
  "success": false,
  "error": "Out of stock",
  "code": "OUT_OF_STOCK"
}
```

**NotFoundError:**
```json
{
  "success": false,
  "error": "User not found"
}
```

---

## Level 3: Advanced - Custom Error Classes

You can create custom error classes for your business domain.

### 3.1 Creating Custom Error Classes

```javascript
// errors/PaymentError.js
const { HttpError } = require('numflow')

class PaymentError extends HttpError {
  constructor(message, { transactionId, reason, refundable = false }) {
    super(message, 402)  // 402 Payment Required
    this.name = 'PaymentError'
    this.transactionId = transactionId
    this.reason = reason        // 'INSUFFICIENT_FUNDS', 'CARD_DECLINED', etc.
    this.refundable = refundable
  }
}

module.exports = { PaymentError }
```

```javascript
// errors/RateLimitError.js
const { HttpError } = require('numflow')

class RateLimitError extends HttpError {
  constructor(message, { limit, remaining, resetAt }) {
    super(message, 429)
    this.name = 'RateLimitError'
    this.limit = limit
    this.remaining = remaining
    this.resetAt = resetAt
  }
}

module.exports = { RateLimitError }
```

```javascript
// errors/ExternalAPIError.js
const { HttpError } = require('numflow')

class ExternalAPIError extends HttpError {
  constructor(message, { provider, originalStatus, retryable = false }) {
    super(message, 502)  // 502 Bad Gateway
    this.name = 'ExternalAPIError'
    this.provider = provider      // 'stripe', 'openai', etc.
    this.originalStatus = originalStatus
    this.retryable = retryable
  }
}

module.exports = { ExternalAPIError }
```

### 3.2 Using in Steps

```javascript
// features/api/payments/@post/steps/200-process-payment.js
const { PaymentError } = require('../../../../errors/PaymentError')
const { ExternalAPIError } = require('../../../../errors/ExternalAPIError')

module.exports = async (ctx, req, res) => {
  try {
    const result = await stripeService.charge({
      amount: ctx.amount,
      cardToken: ctx.cardToken
    })

    if (!result.success) {
      throw new PaymentError('Payment failed', {
        transactionId: result.transactionId,
        reason: result.declineCode,
        refundable: false
      })
    }

    ctx.paymentResult = result

  } catch (error) {
    // Wrap Stripe API error
    if (error.type === 'StripeAPIError') {
      throw new ExternalAPIError('Payment service connection failed', {
        provider: 'stripe',
        originalStatus: error.statusCode,
        retryable: error.statusCode >= 500
      })
    }
    throw error
  }
}
```

### 3.3 Handling in Feature's onError

```javascript
// features/api/payments/@post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // Rollback transaction
    if (ctx.dbTransaction) {
      await ctx.dbTransaction.rollback()
    }

    // Handle by error type (using name property)
    const errorName = error.name || error.originalError?.name

    switch (errorName) {
      case 'PaymentError':
        // Log payment failure
        await logService.logPaymentFailure({
          transactionId: error.transactionId,
          reason: error.reason,
          userId: ctx.userId
        })
        break

      case 'ExternalAPIError':
        // Retryable external API error
        if (error.retryable && (ctx.retryCount || 0) < 3) {
          ctx.retryCount = (ctx.retryCount || 0) + 1
          return numflow.retry({ delay: 1000 * ctx.retryCount })
        }
        break
    }

    // Delegate to global handler
    throw error
  }
})
```

### 3.4 Handling in app.onError()

```javascript
// app.js
const numflow = require('numflow')
const { isHttpError } = numflow

const app = numflow()

app.onError((err, req, res) => {
  // Logging
  console.error(`[${err.name}] ${err.message}`, {
    statusCode: err.statusCode,
    path: req.url,
    method: req.method
  })

  // HttpError family (built-in + custom)
  if (isHttpError(err)) {
    const response = {
      success: false,
      error: {
        type: err.name,
        message: err.message
      }
    }

    // Automatically include custom properties for each error type
    if (err.validationErrors) response.error.fields = err.validationErrors
    if (err.code) response.error.code = err.code
    if (err.transactionId) response.error.transactionId = err.transactionId
    if (err.reason) response.error.reason = err.reason
    if (err.refundable !== undefined) response.error.refundable = err.refundable
    if (err.provider) response.error.provider = err.provider
    if (err.retryAfter) response.error.retryAfter = err.retryAfter
    if (err.resetAt) response.error.resetAt = err.resetAt

    // Set headers for RateLimitError
    if (err.name === 'RateLimitError') {
      res.setHeader('X-RateLimit-Limit', err.limit)
      res.setHeader('X-RateLimit-Remaining', err.remaining)
      res.setHeader('X-RateLimit-Reset', err.resetAt)
    }

    return res.status(err.statusCode).json(response)
  }

  // Unknown error
  const isProd = process.env.NODE_ENV === 'production'
  res.status(500).json({
    success: false,
    error: {
      type: 'InternalError',
      message: isProd ? 'Something went wrong' : err.message
    }
  })
})
```

### 3.5 Response Examples

**PaymentError:**
```json
{
  "success": false,
  "error": {
    "type": "PaymentError",
    "message": "Payment failed",
    "transactionId": "tx_abc123",
    "reason": "CARD_DECLINED",
    "refundable": false
  }
}
```

**ExternalAPIError:**
```json
{
  "success": false,
  "error": {
    "type": "ExternalAPIError",
    "message": "Payment service connection failed",
    "provider": "stripe"
  }
}
```

**RateLimitError (with headers):**
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699123456

{
  "success": false,
  "error": {
    "type": "RateLimitError",
    "message": "Rate limit exceeded",
    "resetAt": 1699123456
  }
}
```

---

## Understanding Error Flow

### Error Handling Flow Diagram

```
Step throws new Error()
         |
    Does Feature have onError?
         |
    +----+----+
   Yes        No
    |          |
onError()   Wrap with FeatureExecutionError
runs          |
    |      Pass to app.onError()
    |
    +-- Send response (res.json/end)
    |   -> Done (app.onError not called)
    |
    +-- Return numflow.retry()
    |   -> Retry Feature
    |
    +-- throw error
        -> Pass to app.onError()
```

### Retry Feature

```javascript
// features/api/chat/@post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.provider = 'openai'
    ctx.retryCount = 0
  },

  onError: async (error, ctx, req, res) => {
    // Rate limit error -> Change provider and retry
    if (error.message.includes('rate_limit')) {
      const providers = ['openai', 'anthropic', 'gemini']
      const currentIndex = providers.indexOf(ctx.provider)

      if (currentIndex < providers.length - 1) {
        ctx.provider = providers[currentIndex + 1]
        return numflow.retry({ delay: 500 })  // Retry after 0.5s
      }
    }

    // Timeout error -> Exponential backoff
    if (error.message.includes('timeout')) {
      ctx.retryCount++
      if (ctx.retryCount <= 3) {
        const delay = 1000 * Math.pow(2, ctx.retryCount - 1)  // 1s, 2s, 4s
        return numflow.retry({ delay, maxAttempts: 3 })
      }
    }

    // Cannot retry -> Delegate to global handler
    throw error
  }
})
```

**retry() Options:**
- `delay`: Wait time before retry (ms)
- `maxAttempts`: Maximum retry attempts

---

## Error Utilities

### isHttpError()

Checks if an error is an HttpError. Uses **Duck Typing** to work across different module instances.

```javascript
const { isHttpError } = require('numflow')

app.onError((err, req, res) => {
  if (isHttpError(err)) {
    // Handles both Numflow errors + external errors with statusCode
    return res.status(err.statusCode).json({ error: err.message })
  }

  res.status(500).json({ error: 'Internal Server Error' })
})
```

### isOperationalError()

Checks if an error is an operational error (expected error).

```javascript
const { isOperationalError } = require('numflow')

app.onError((err, req, res) => {
  if (isOperationalError(err)) {
    // Expected error - log at INFO level
    console.info('Operational error:', err.message)
  } else {
    // Unexpected error - log at ERROR level with stack
    console.error('Programming error:', err.stack)
  }

  res.status(err.statusCode || 500).json({ error: err.message })
})
```

### Why Duck Typing?

With `file:../../numflow` or monorepo setups, module instances may differ, causing `instanceof` checks to fail.

```javascript
// Works across different module instances:
if (isHttpError(err)) { ... }  // Recommended

// May fail with different module instances:
if (err instanceof HttpError) { ... }  // Risky
```

---

## Development vs Production

```javascript
// app.js
const numflow = require('numflow')
const { isHttpError } = numflow

const app = numflow()
const isProd = process.env.NODE_ENV === 'production'

app.onError((err, req, res) => {
  // Logging
  if (isProd) {
    // Production: send to external service
    errorTracker.capture(err, { req })
  } else {
    // Development: console output
    console.error(err.stack)
  }

  // Response
  if (isHttpError(err)) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.validationErrors && { validationErrors: err.validationErrors }),
      ...(err.code && { code: err.code }),
      // Include stack only in development
      ...(!isProd && { stack: err.stack })
    })
  }

  res.status(500).json({
    success: false,
    error: isProd ? 'Internal Server Error' : err.message,
    ...(!isProd && { stack: err.stack })
  })
})
```

---

## Summary

| Level | Error Type | Features | When to Use |
|-------|------------|----------|-------------|
| **1. Basics** | `new Error()` | Fixed statusCode 500 | Quick prototyping |
| **2. Intermediate** | Numflow built-in | statusCode + extra properties | General API development |
| **3. Advanced** | Custom classes | Domain-specific properties | Complex business logic |

| Handler | Scope | ctx Access | Purpose |
|---------|-------|------------|---------|
| **onError** | Feature only | Yes | Transaction rollback, retry |
| **app.onError()** | Entire app | No | Unified logging, response format |

---

**Last Updated**: 2025-11-25 (Restructured by difficulty level)

**Previous**: [Table of Contents](./README.md)
