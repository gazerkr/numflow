# Numflow

> Express 5.x 호환 고성능 Node.js 웹 프레임워크

Numflow는 Express 5.x API와 완전히 호환되면서 평균 3.3배 빠른 성능을 제공하는 Node.js 웹 프레임워크입니다.

[![npm version](https://img.shields.io/npm/v/numflow.svg)](https://www.npmjs.com/package/numflow)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Tests: 1018 passing](https://img.shields.io/badge/tests-1018%20passing-brightgreen.svg)](https://github.com/gazerkr/numflow)

---

## 주요 특징

### Express 5.x 완전 호환

Numflow는 Express 5.x와 100% API 호환성을 제공합니다.

```javascript
// Express
const express = require('express')
const app = express()

// Numflow - require 문만 변경
const numflow = require('numflow')
const app = numflow()
```

기존 Express 코드와 미들웨어를 수정 없이 사용할 수 있습니다:
- express.json() / express.urlencoded()
- cookie-parser, helmet, morgan, cors
- passport, multer, express-session
- 기타 모든 Express 미들웨어

### 고성능

Radix Tree 기반 라우팅을 통해 Express 대비 평균 **3.3배 (228%)** 빠른 성능을 제공합니다.

- Express 대비: +228% (평균 3.3배 빠름)
- POST 요청에서는 Fastify를 능가 (+12%)
- Feature-First 오버헤드: 단 0.70% (거의 무시 가능)

자세한 벤치마크 결과는 [성능 벤치마크](#성능-벤치마크) 섹션을 참고하세요.

### Feature-First Architecture

설정 파일 없이 폴더 구조만으로 복잡한 비즈니스 로직을 자동 실행하는 아키텍처를 제공합니다.

**Zero Configuration**: `index.js` 파일 생성 불필요. 폴더와 파일명만으로 API가 자동 생성됩니다.

**폴더 구조 (Implicit Feature - index.js 불필요):**
```
features/
  api/
    orders/
      @post/              # POST /api/orders (@ prefix로 HTTP method 명시)
        steps/            # 파일명 숫자 순서대로 자동 실행
          100-validate.js       # 1번째 실행
          200-check-stock.js    # 2번째 실행
          300-create-order.js   # 3번째 실행
        async-tasks/      # 응답 후 비동기 실행
          send-email.js
          send-push.js
```

`index.js`는 **선택사항**입니다. 폴더 구조만으로도 자동으로 Feature가 생성됩니다.

**폴더 구조 (Explicit Feature - 추가 설정 필요 시):**
```
features/
  api/
    orders/
      @post/
        index.js          # ← contextInitializer, middlewares 등 추가 설정
        steps/
          100-validate.js
          200-check-stock.js
        async-tasks/
          send-email.js
```

**index.js를 사용하는 경우:**
```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  // 추가 설정 (선택사항)
  contextInitializer: (ctx, req, res) => {
    ctx.startTime = Date.now()
  },
  middlewares: [authMiddleware, rateLimitMiddleware],
})
```

**애플리케이션 등록:**
```javascript
const numflow = require('numflow')
const app = numflow()

app.registerFeatures('./features')  // 폴더 구조 자동 스캔
app.listen(3000)
```

**핵심 특징:**

1. **설정 파일 불필요 (Zero Configuration)**
   - `index.js` 파일 생성 불필요
   - 폴더 구조만으로 자동으로 API 생성
   - HTTP method, path, steps, async-tasks 모두 자동 추론
   - 추가 설정이 필요한 경우에만 선택적으로 `index.js` 사용

2. **파일명 숫자 기반 자동 실행 순서**
   - `100-`, `200-`, `300-` 순서대로 자동 실행
   - 실행 순서가 파일명으로 명확하게 표현됨
   - 별도 설정 파일 불필요

3. **폴더 구조만으로 비즈니스 로직 파악**
   - 코드를 열지 않아도 전체 흐름 이해 가능
   - `features/api/orders/@post/steps/` → POST /api/orders의 처리 단계
   - `@` prefix로 HTTP method를 명시적으로 표현 (resource 이름과 충돌 방지)
   - 각 파일명이 곧 해당 단계의 역할을 설명

4. **유연한 로직 관리**
   - **추가**: `150-check-user-auth.js` 파일을 생성하면 100과 200 사이에 자동 삽입 및 실행
   - **삭제**: 파일 삭제만으로 해당 단계 제거
   - **순서 변경**: 파일명 숫자만 변경하면 실행 순서 변경
   - 기존 코드 수정 없이 로직 구조 변경 가능

**`@` prefix 사용 이유:**

`@` prefix는 HTTP method 폴더를 명시적으로 구분하여 resource 이름과의 충돌을 방지합니다.

```
# @ prefix 없이 사용하면 충돌 발생
features/workflows/[id]/steps/get/  # ← "steps"가 resource인가? 폴더인가?

# @ prefix로 명확하게 구분
features/workflows/[id]/steps/@get/  # ← GET /workflows/:id/steps
                          └─ resource name
                                └─ HTTP method
```

**추가 폴더 구조 예제:**
```
features/
  users/@get/              # GET /users
  users/@post/             # POST /users
  users/[id]/@get/         # GET /users/:id
  users/[id]/@put/         # PUT /users/:id
  users/[id]/@delete/      # DELETE /users/:id
  api/v1/orders/@post/     # POST /api/v1/orders
```

**추가 특징:**
- **트랜잭션 관리**: `contextInitializer`, `onError` 훅을 통한 트랜잭션 관리
- **비동기 작업 자동 실행**: 응답 후 async-tasks 자동 실행
- **중앙집중식 에러 처리**: `onError` 훅으로 통합 에러 처리
- **최소 오버헤드**: 성능 오버헤드 0.70% (10 steps 기준)

### WebSocket 지원

Numflow는 Express와 100% 호환되는 WebSocket을 지원합니다.

```javascript
const numflow = require('numflow')
const { WebSocketServer } = require('ws')

const app = numflow()
const server = app.listen(3000)

// ws 라이브러리
const wss = new WebSocketServer({ noServer: true })
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request)
  })
})

// Socket.IO도 완전 지원
const io = require('socket.io')(server)
io.on('connection', (socket) => {
  socket.emit('welcome', { message: 'Connected!' })
})
```

### ESM과 CommonJS 완전 지원

Numflow는 모든 모듈 시스템을 완벽하게 지원합니다.

```javascript
// CommonJS
const numflow = require('numflow')

// ESM
import numflow from 'numflow'

// TypeScript
import numflow from 'numflow'
import type { Application, Request, Response } from 'numflow'
```

모든 파일 확장자 지원:
- `.js`, `.cjs` (CommonJS)
- `.mjs`, `.mts` (ESM)
- `.ts` (TypeScript)

---

## 설치

```bash
npm install numflow
```

---

## 빠른 시작

### Hello World (JavaScript)

**CommonJS:**
```javascript
const numflow = require('numflow')
const app = numflow()

app.get('/', (req, res) => {
  res.json({ message: 'Hello Numflow' })
})

app.listen(3000)
```

**ESM:**
```javascript
import numflow from 'numflow'
const app = numflow()

app.get('/', (req, res) => {
  res.json({ message: 'Hello Numflow' })
})

app.listen(3000)
```

### TypeScript

```typescript
import numflow from 'numflow'
const app = numflow()

app.get('/', (req, res) => {
  res.json({ message: 'Hello Numflow' })
})

app.listen(3000)
```

---

## Express에서 마이그레이션

### 1단계: 패키지 설치

```bash
npm install numflow
```

### 2단계: Import 문 변경

```javascript
// Before
const express = require('express')

// After
const numflow = require('numflow')
```

### 3단계: 완료

나머지 코드는 수정 없이 사용 가능합니다.

**호환되는 항목:**
- 모든 HTTP 메서드 (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
- 모든 미들웨어
- req.params, req.query, req.body
- res.json(), res.send(), res.status(), res.redirect()
- Router, app.use(), app.all()
- express.static()

**검증 현황:**
- 1,018개 테스트 100% 통과
- Express 5.x API 호환성 검증 완료
- 주요 미들웨어 호환성 검증 완료

---

## Feature-First 사용 예제

### 주문 생성 API

**가장 간단한 방법 (index.js 불필요):**
```
features/
  api/
    orders/
      @post/
        steps/
          100-validate-request.js
          200-check-user-auth.js
          300-check-product-stock.js
          400-create-order.js
          500-process-payment.js
        async-tasks/
          send-order-email.js
          send-push-notification.js
          update-analytics.js
```

폴더 구조만으로 자동으로 `POST /api/orders` API가 생성됩니다.

**추가 설정이 필요한 경우 (index.js 사용):**
```
features/
  api/
    orders/
      @post/
        index.js          # ← 추가 설정 (contextInitializer, middlewares, onError Hook)
        steps/
          ...
```

**features/api/orders/@post/index.js:**
```javascript
const numflow = require('numflow')

module.exports = numflow.feature({
  // method, path, steps, asyncTasks는 폴더 구조에서 자동 추론
  // 필요한 경우만 추가 설정
  contextInitializer: (ctx, req, res) => {
    ctx.startTime = Date.now()
    ctx.userId = req.user?.id
  },
})
```

**steps/100-validate-request.js:**
```javascript
module.exports = async (ctx, req, res) => {
  const { productId, quantity } = req.body

  if (!productId || !quantity) {
    throw new Error('productId and quantity are required')
  }

  ctx.productId = productId
  ctx.quantity = quantity
}
```

**steps/300-check-product-stock.js:**
```javascript
module.exports = async (ctx, req, res) => {
  const product = await db.products.findById(ctx.productId)

  if (product.stock < ctx.quantity) {
    throw new Error('Insufficient stock')
  }

  ctx.product = product
}
```

**steps/400-create-order.js:**
```javascript
module.exports = async (ctx, req, res) => {
  const order = await db.orders.create({
    userId: req.user.id,
    productId: ctx.productId,
    quantity: ctx.quantity,
    totalPrice: ctx.product.price * ctx.quantity,
  })

  ctx.order = order
  res.json({ success: true, orderId: order.id })
}
```

**async-tasks/send-order-email.js:**
```javascript
module.exports = async (ctx) => {
  await emailService.send({
    to: ctx.order.userEmail,
    template: 'order-confirmation',
    data: { order: ctx.order },
  })
}
```

**app.js:**
```javascript
const numflow = require('numflow')
const app = numflow()

app.registerFeatures('./features')
app.listen(3000)
```

### 유연한 로직 관리 예제

**시나리오: 권한 검증 로직 추가**

기존 로직 사이에 새로운 단계를 추가해야 하는 경우:

```
# 기존 구조
steps/
  100-validate-request.js
  300-check-product-stock.js
  400-create-order.js

# 새 파일 추가만으로 로직 삽입
steps/
  100-validate-request.js
  200-check-user-auth.js      # ← 새로 추가 (기존 코드 수정 불필요)
  300-check-product-stock.js
  400-create-order.js
```

**steps/200-check-user-auth.js 생성:**
```javascript
module.exports = async (ctx, req, res) => {
  if (!req.user || !req.user.isActive) {
    throw new Error('Unauthorized')
  }

  ctx.userId = req.user.id
}
```

서버 재시작만으로 100 → 200 → 300 → 400 순서로 자동 실행됩니다.

**로직 삭제:**
```bash
# 재고 확인 단계 제거
rm steps/300-check-product-stock.js
# 서버 재시작 → 100 → 200 → 400 순서로 자동 실행
```

**실행 순서 변경:**
```bash
# 결제를 주문 생성보다 먼저 실행하고 싶은 경우
mv steps/500-process-payment.js steps/350-process-payment.js
mv steps/400-create-order.js steps/450-create-order.js
# 서버 재시작 → 100 → 200 → 300 → 350(결제) → 450(주문) 순서로 실행
```

---

## 성능 벤치마크

### 테스트 환경

- Node.js v22.11.0
- macOS (Apple Silicon)
- Autocannon (100 connections, 10s duration)

### 전체 결과

| 시나리오 | Express | Numflow | Fastify | vs Express | vs Fastify |
|---------|---------|---------|---------|-----------|-----------|
| Hello World | 20,542 req/s | 75,626 req/s | 89,108 req/s | +268% | -15% |
| JSON Response (GET) | 20,421 req/s | 65,574 req/s | 86,607 req/s | +221% | -24% |
| JSON Parse (POST) | 18,151 req/s | 57,872 req/s | 51,664 req/s | +219% | +12% ⭐ |
| Route Params (단일) | 19,790 req/s | 65,734 req/s | 84,025 req/s | +232% | -22% |
| Route Params (복수) | 19,982 req/s | 62,387 req/s | 80,992 req/s | +212% | -23% |
| Route + Query | 19,893 req/s | 61,988 req/s | 85,082 req/s | +212% | -27% |
| Middleware Chain | 19,080 req/s | 63,254 req/s | 83,837 req/s | +232% | -25% |
| **평균** | **19,694 req/s** | **64,634 req/s** | **80,188 req/s** | **+228%** | **-19%** |

### Feature-First 성능

Feature-First 아키텍처의 성능 오버헤드는 단 **0.70%**로 거의 무시할 수 있는 수준입니다:

- Regular Route: 49,714 req/s
- Feature (10 Steps): 49,366 req/s
- **오버헤드: 0.70%** (10 단계 기준)

복잡한 비즈니스 로직을 구조화하면서도 거의 성능 손실 없이 사용할 수 있습니다.

자세한 벤치마크 결과는 [PERFORMANCE.md](docs/ko/PERFORMANCE.md)를 참고하세요

---

## 테스트 및 검증

### 테스트

- 1,018개 테스트 100% 통과
- 코어 기능 테스트
- Express 호환성 테스트
- 미들웨어 호환성 테스트
- Feature-First 통합 테스트
- 성능 회귀 테스트

### Express 호환성

- Express 5.x API 100% 호환
- 주요 Express 미들웨어 검증 완료
- 1,018개 테스트로 검증

자세한 호환성 정보: [COMPATIBILITY.md](docs/ko/COMPATIBILITY.md)

---

## 문서

### 시작하기

- [Getting Started](docs/ko/getting-started/README.md) - 초보자 가이드
- [첫 앱 만들기](docs/ko/getting-started/first-app.md) - 첫 Numflow 앱 만들기
- [프로젝트 구조 가이드](docs/ko/getting-started/project-structure.md) - 확장 가능한 프로젝트 구조

### 심화

- [Feature-First 가이드](docs/ko/getting-started/feature-first.md) - 복잡한 로직 구조화
- [라우팅](docs/ko/getting-started/routing.md) - 완전한 라우팅 가이드
- [미들웨어](docs/ko/getting-started/middleware.md) - 미들웨어 사용법
- [에러 처리](docs/ko/getting-started/error-handling.md) - 에러 처리 전략
- [API 문서](docs/ko/api) - 전체 API 레퍼런스
- [아키텍처 설계](docs/ko/ARCHITECTURE.md) - 내부 구조

### 성능

- [성능 비교](docs/ko/PERFORMANCE.md) - 성능 최적화 기법

### 호환성

- [Express 호환성](docs/ko/COMPATIBILITY.md) - Express 호환성 상세

---

## Showcase

### 실제 프로젝트 예제

Numflow의 Feature-First 아키텍처를 활용한 실제 프로젝트 예제를 확인해보세요:

#### 📝 [Numflow Feature-First Blog](https://github.com/gazerkr/numflow-feature-first-blog)

완전히 작동하는 설치형 블로그 애플리케이션입니다. Feature-First 아키텍처를 사용하여 다음과 같은 기능을 구현했습니다:

- 게시글 CRUD (생성, 조회, 수정, 삭제)
- 댓글 시스템
- 사용자 인증 및 권한 관리
- 파일 업로드 (이미지)
- 페이지네이션
- 검색 기능

이 예제를 통해 다음을 배울 수 있습니다:
- Feature-First 폴더 구조 설계 방법
- Steps와 Async Tasks를 활용한 비즈니스 로직 구조화
- Context를 이용한 데이터 공유
- 트랜잭션 관리 및 에러 처리 패턴

---

## 기여

이슈 리포트, 기능 제안, 문서 개선, 코드 기여를 환영합니다.

- 버그 리포트: [Issues](https://github.com/gazerkr/numflow/issues)
- 기능 제안: [Issues](https://github.com/gazerkr/numflow/issues)
- Pull Request: [Pull Requests](https://github.com/gazerkr/numflow/pulls)

---

## FAQ

**Q: Express와 100% 호환되는가?**

A: 1,018개의 테스트로 검증했습니다. Express 5.x의 모든 핵심 API와 주요 미들웨어가 호환됩니다.

**Q: Feature-First는 필수인가?**

A: 선택사항입니다. Express 방식으로만 사용해도 무방합니다.

**Q: TypeScript 필수인가?**

A: 아닙니다. JavaScript(CommonJS/ESM)를 완전히 지원합니다. TypeScript는 선택사항입니다.

**Q: Express보다 3.3배 빠른 성능이 실제 환경에서도 동일한가?**

A: 벤치마크 결과는 평균 3.3배(228%)입니다. 실제 성능은 애플리케이션 구조, 미들웨어 사용, 비즈니스 로직에 따라 달라질 수 있습니다.

**Q: Fastify와의 차이점은?**

A: Fastify는 자체 API를 사용합니다. Numflow는 Express API를 유지하면서 Fastify에 근접한 성능을 제공합니다.

---

## 라이선스

MIT License

---

## 참고

이 프로젝트는 다음 프로젝트들의 아이디어를 참고했습니다:

- [Express.js](https://expressjs.com/) - API 호환성
- [Fastify](https://www.fastify.io/) - 성능 최적화
- [find-my-way](https://github.com/delvedor/find-my-way) - Radix Tree 라우팅
