# 에러 처리 (Error Handling)

## 목차

- [Level 1: 기초 - 단순 에러 처리](#level-1-기초---단순-에러-처리)
- [Level 2: 중급 - Numflow 내장 에러 타입](#level-2-중급---numflow-내장-에러-타입)
- [Level 3: 고급 - 커스텀 에러 클래스](#level-3-고급---커스텀-에러-클래스)
- [에러 흐름 이해하기](#에러-흐름-이해하기)
- [에러 유틸리티](#에러-유틸리티)
- [개발 vs 프로덕션](#개발-vs-프로덕션)

---

## Level 1: 기초 - 단순 에러 처리

가장 기본적인 에러 처리입니다. `throw new Error("...")`로 에러를 던지면 자동으로 처리됩니다.

### 1.1 기본 사용법

```javascript
// Step에서 에러 던지기
// features/api/users/@get/steps/100-fetch.js
module.exports = async (ctx, req, res) => {
  const user = await db.findUser(req.params.id)

  if (!user) {
    throw new Error('User not found')  // 단순히 에러 던지기
  }

  ctx.user = user
}
```

**자동 응답 (500 Internal Server Error):**
```json
{
  "error": {
    "message": "User not found",
    "statusCode": 500
  }
}
```

### 1.2 Feature의 onError 핸들러

해당 Feature에서만 에러를 처리합니다. **ctx에 접근 가능**하여 트랜잭션 롤백 등을 할 수 있습니다.

```javascript
// features/api/orders/@post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  contextInitializer: async (ctx, req, res) => {
    ctx.transaction = await db.beginTransaction()
  },

  onError: async (error, ctx, req, res) => {
    console.log('에러 발생:', error.message)

    // 트랜잭션 롤백
    if (ctx.transaction) {
      await ctx.transaction.rollback()
    }

    // 직접 응답 보내기
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({
      success: false,
      error: error.message
    }))
  }
})
```

### 1.3 app.onError() 글로벌 핸들러

모든 라우트와 Feature에서 발생하는 에러를 한 곳에서 처리합니다.

```javascript
// app.js
const numflow = require('numflow')
const app = numflow()

// 글로벌 에러 핸들러
app.onError((err, req, res) => {
  console.error('에러:', err.message)

  res.status(500).json({
    success: false,
    error: err.message
  })
})

app.registerFeatures('./features')
app.listen(3000)
```

### 1.4 onError + app.onError() 함께 사용하기

```javascript
// features/api/orders/@post/index.js - cleanup만 수행
module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // 트랜잭션 롤백만 수행
    if (ctx.transaction) {
      await ctx.transaction.rollback()
    }

    // 글로벌 핸들러로 위임
    throw error
  }
})

// app.js - 통합 응답 처리
app.onError((err, req, res) => {
  res.status(500).json({
    success: false,
    error: err.message
  })
})
```

---

## Level 2: 중급 - Numflow 내장 에러 타입

Numflow는 HTTP 상태 코드에 맞는 에러 클래스를 제공합니다.

### 2.1 에러 클래스 목록

```javascript
const {
  ValidationError,        // 400 - 검증 에러 (validationErrors 속성)
  BusinessError,          // 400 - 비즈니스 에러 (code 속성)
  UnauthorizedError,      // 401 - 인증 필요
  ForbiddenError,         // 403 - 권한 없음
  NotFoundError,          // 404 - 리소스 없음
  ConflictError,          // 409 - 충돌
  PayloadTooLargeError,   // 413 - 페이로드 크기 초과
  TooManyRequestsError,   // 429 - 요청 제한 초과 (retryAfter 속성)
  InternalServerError,    // 500 - 서버 에러
  NotImplementedError,    // 501 - 미구현
  ServiceUnavailableError // 503 - 서비스 이용 불가
} = require('numflow')
```

### 2.2 Step에서 사용하기

```javascript
// features/api/users/@post/steps/100-validate.js
const { ValidationError, ConflictError } = require('numflow')

module.exports = async (ctx, req, res) => {
  const { email, password } = req.body

  // 검증 에러 - 필드별 에러 메시지 포함
  const errors = {}
  if (!email?.includes('@')) {
    errors.email = ['유효한 이메일을 입력하세요']
  }
  if (!password || password.length < 8) {
    errors.password = ['비밀번호는 8자 이상이어야 합니다']
  }

  if (Object.keys(errors).length > 0) {
    throw new ValidationError('검증 실패', errors)
  }

  // 중복 체크
  const exists = await db.findUserByEmail(email)
  if (exists) {
    throw new ConflictError('이미 사용 중인 이메일입니다')
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
    throw new BusinessError('재고가 부족합니다', 'OUT_OF_STOCK')
  }

  ctx.stockChecked = true
}
```

### 2.3 Feature의 onError에서 처리하기

```javascript
// features/api/payments/@post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // 트랜잭션 롤백
    if (ctx.transaction) {
      await ctx.transaction.rollback()
    }

    // 에러 코드로 분기 처리
    const code = error.code || error.originalError?.code

    switch (code) {
      case 'OUT_OF_STOCK':
        // 재고 부족 - 예약 취소
        await inventoryService.releaseReservation(ctx.reservationId)
        break

      case 'PAYMENT_DECLINED':
        // 결제 거절 로깅
        await logService.logPaymentFailure(ctx.paymentId, error)
        break
    }

    // 글로벌 핸들러로 위임
    throw error
  }
})
```

### 2.4 app.onError()에서 처리하기

```javascript
// app.js
const numflow = require('numflow')
const { isHttpError } = numflow

const app = numflow()

app.onError((err, req, res) => {
  console.error('에러:', err.message)

  // isHttpError()로 체크 (duck typing - 모듈 인스턴스 문제 해결)
  if (isHttpError(err)) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      // 각 에러 타입의 추가 속성 포함
      ...(err.validationErrors && { validationErrors: err.validationErrors }),
      ...(err.code && { code: err.code }),
      ...(err.retryAfter && { retryAfter: err.retryAfter })
    })
  }

  // 알 수 없는 에러
  res.status(500).json({
    success: false,
    error: 'Internal Server Error'
  })
})
```

### 2.5 응답 예시

**ValidationError:**
```json
{
  "success": false,
  "error": "검증 실패",
  "validationErrors": {
    "email": ["유효한 이메일을 입력하세요"],
    "password": ["비밀번호는 8자 이상이어야 합니다"]
  }
}
```

**BusinessError:**
```json
{
  "success": false,
  "error": "재고가 부족합니다",
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

## Level 3: 고급 - 커스텀 에러 클래스

비즈니스 도메인에 맞는 커스텀 에러 클래스를 만들 수 있습니다.

### 3.1 커스텀 에러 클래스 만들기

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

### 3.2 Step에서 사용하기

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
      throw new PaymentError('결제 실패', {
        transactionId: result.transactionId,
        reason: result.declineCode,
        refundable: false
      })
    }

    ctx.paymentResult = result

  } catch (error) {
    // Stripe API 에러 래핑
    if (error.type === 'StripeAPIError') {
      throw new ExternalAPIError('결제 서비스 연결 실패', {
        provider: 'stripe',
        originalStatus: error.statusCode,
        retryable: error.statusCode >= 500
      })
    }
    throw error
  }
}
```

### 3.3 Feature의 onError에서 처리하기

```javascript
// features/api/payments/@post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  onError: async (error, ctx, req, res) => {
    // 트랜잭션 롤백
    if (ctx.dbTransaction) {
      await ctx.dbTransaction.rollback()
    }

    // 에러 타입별 처리 (name 속성 사용)
    const errorName = error.name || error.originalError?.name

    switch (errorName) {
      case 'PaymentError':
        // 결제 실패 로깅
        await logService.logPaymentFailure({
          transactionId: error.transactionId,
          reason: error.reason,
          userId: ctx.userId
        })
        break

      case 'ExternalAPIError':
        // 재시도 가능한 외부 API 에러
        if (error.retryable && (ctx.retryCount || 0) < 3) {
          ctx.retryCount = (ctx.retryCount || 0) + 1
          return numflow.retry({ delay: 1000 * ctx.retryCount })
        }
        break
    }

    // 글로벌 핸들러로 위임
    throw error
  }
})
```

### 3.4 app.onError()에서 처리하기

```javascript
// app.js
const numflow = require('numflow')
const { isHttpError } = numflow

const app = numflow()

app.onError((err, req, res) => {
  // 로깅
  console.error(`[${err.name}] ${err.message}`, {
    statusCode: err.statusCode,
    path: req.url,
    method: req.method
  })

  // HttpError 계열 (내장 + 커스텀)
  if (isHttpError(err)) {
    const response = {
      success: false,
      error: {
        type: err.name,
        message: err.message
      }
    }

    // 각 에러 타입의 커스텀 속성 자동 포함
    if (err.validationErrors) response.error.fields = err.validationErrors
    if (err.code) response.error.code = err.code
    if (err.transactionId) response.error.transactionId = err.transactionId
    if (err.reason) response.error.reason = err.reason
    if (err.refundable !== undefined) response.error.refundable = err.refundable
    if (err.provider) response.error.provider = err.provider
    if (err.retryAfter) response.error.retryAfter = err.retryAfter
    if (err.resetAt) response.error.resetAt = err.resetAt

    // RateLimitError 헤더 설정
    if (err.name === 'RateLimitError') {
      res.setHeader('X-RateLimit-Limit', err.limit)
      res.setHeader('X-RateLimit-Remaining', err.remaining)
      res.setHeader('X-RateLimit-Reset', err.resetAt)
    }

    return res.status(err.statusCode).json(response)
  }

  // 알 수 없는 에러
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

### 3.5 응답 예시

**PaymentError:**
```json
{
  "success": false,
  "error": {
    "type": "PaymentError",
    "message": "결제 실패",
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
    "message": "결제 서비스 연결 실패",
    "provider": "stripe"
  }
}
```

**RateLimitError (헤더 포함):**
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699123456

{
  "success": false,
  "error": {
    "type": "RateLimitError",
    "message": "요청 한도 초과",
    "resetAt": 1699123456
  }
}
```

---

## 에러 흐름 이해하기

### 에러 처리 흐름도

```
Step에서 throw new Error()
         ↓
    Feature에 onError 있음?
         ↓
    ┌────┴────┐
   Yes        No
    ↓          ↓
onError()   FeatureExecutionError로 wrap
실행          ↓
    ↓      app.onError()로 전달
    │
    ├─ 응답 전송 (res.json/end)
    │   → 끝 (app.onError 실행 안 됨)
    │
    ├─ numflow.retry() 반환
    │   → Feature 재시도
    │
    └─ throw error
        → app.onError()로 전달
```

### 재시도 (Retry) 기능

```javascript
// features/api/chat/@post/index.js
const numflow = require('numflow')

module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.provider = 'openai'
    ctx.retryCount = 0
  },

  onError: async (error, ctx, req, res) => {
    // Rate limit 에러 → Provider 변경 후 재시도
    if (error.message.includes('rate_limit')) {
      const providers = ['openai', 'anthropic', 'gemini']
      const currentIndex = providers.indexOf(ctx.provider)

      if (currentIndex < providers.length - 1) {
        ctx.provider = providers[currentIndex + 1]
        return numflow.retry({ delay: 500 })  // 0.5초 후 재시도
      }
    }

    // Timeout 에러 → Exponential backoff
    if (error.message.includes('timeout')) {
      ctx.retryCount++
      if (ctx.retryCount <= 3) {
        const delay = 1000 * Math.pow(2, ctx.retryCount - 1)  // 1s, 2s, 4s
        return numflow.retry({ delay, maxAttempts: 3 })
      }
    }

    // 재시도 불가능 → 글로벌 핸들러로
    throw error
  }
})
```

**retry() 옵션:**
- `delay`: 재시도 전 대기 시간 (ms)
- `maxAttempts`: 최대 재시도 횟수

---

## 에러 유틸리티

### isHttpError()

에러가 HttpError인지 확인합니다. **Duck Typing**을 사용하여 모듈 인스턴스가 달라도 동작합니다.

```javascript
const { isHttpError } = require('numflow')

app.onError((err, req, res) => {
  if (isHttpError(err)) {
    // Numflow 에러 + statusCode 있는 외부 에러 모두 처리
    return res.status(err.statusCode).json({ error: err.message })
  }

  res.status(500).json({ error: 'Internal Server Error' })
})
```

### isOperationalError()

예상된 에러(운영 에러)인지 확인합니다.

```javascript
const { isOperationalError } = require('numflow')

app.onError((err, req, res) => {
  if (isOperationalError(err)) {
    // 예상된 에러 - INFO 레벨 로깅
    console.info('운영 에러:', err.message)
  } else {
    // 예상치 못한 에러 - ERROR 레벨 + 스택
    console.error('프로그래밍 에러:', err.stack)
  }

  res.status(err.statusCode || 500).json({ error: err.message })
})
```

### Duck Typing을 사용하는 이유

`file:../../numflow`나 모노레포 설정 시 모듈 인스턴스가 달라져 `instanceof` 체크가 실패할 수 있습니다.

```javascript
// 모듈 인스턴스가 달라도 동작:
if (isHttpError(err)) { ... }  // ✅ 권장

// 다른 모듈 인스턴스에서 실패할 수 있음:
if (err instanceof HttpError) { ... }  // ⚠️ 위험
```

---

## 개발 vs 프로덕션

```javascript
// app.js
const numflow = require('numflow')
const { isHttpError } = numflow

const app = numflow()
const isProd = process.env.NODE_ENV === 'production'

app.onError((err, req, res) => {
  // 로깅
  if (isProd) {
    // 프로덕션: 외부 서비스로 전송
    errorTracker.capture(err, { req })
  } else {
    // 개발: 콘솔 출력
    console.error(err.stack)
  }

  // 응답
  if (isHttpError(err)) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(err.validationErrors && { validationErrors: err.validationErrors }),
      ...(err.code && { code: err.code }),
      // 개발 환경에서만 스택 포함
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

## 요약

| Level | 에러 타입 | 특징 | 사용 시점 |
|-------|----------|------|----------|
| **1. 기초** | `new Error()` | statusCode 500 고정 | 빠른 프로토타이핑 |
| **2. 중급** | Numflow 내장 | statusCode + 추가 속성 | 일반적인 API 개발 |
| **3. 고급** | 커스텀 클래스 | 도메인 특화 속성 | 복잡한 비즈니스 로직 |

| 핸들러 | 범위 | ctx 접근 | 용도 |
|--------|------|----------|------|
| **onError** | Feature 전용 | ✅ 가능 | 트랜잭션 롤백, 재시도 |
| **app.onError()** | 전체 앱 | ❌ 불가 | 통합 로깅, 응답 포맷 |

---

**마지막 업데이트**: 2025-11-25 (난이도별 구조 재작성)

**이전**: [목차](./README.md)
