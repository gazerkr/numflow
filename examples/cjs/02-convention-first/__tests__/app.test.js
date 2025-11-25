const numflow = require('../../../dist/cjs/index.js')

describe('02-convention-first', () => {
  let app

  beforeAll(async () => {
    app = numflow()

    // Register features (async)
    await app.registerFeatures('./examples-new/02-convention-first/features')
  })

  afterAll(async () => {
    if (app && app.server) {
      await new Promise((resolve) => app.server.close(resolve))
    }
  })

  describe('Convention over Configuration', () => {
    test('GET /hello - Auto-infer HTTP method from @get folder', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/hello'
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.body)
      expect(data).toEqual({
        message: 'Hello from Convention!'
      })
    })

    test('GET /users - Auto-infer path from folder structure', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/users'
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.body)
      expect(data).toHaveProperty('users')
      expect(Array.isArray(data.users)).toBe(true)
    })

    test('GET /users/:id - Auto-infer dynamic parameter from [id] folder', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/users/123'
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.body)
      expect(data).toEqual({
        id: '123',
        name: 'User 123'
      })
    })
  })

  describe('Everything automatic with empty config object!', () => {
    test('numflow.feature({}) - Auto-infer both method and path', async () => {
      // GET /hello is auto-inferred from features/hello/@get/ folder structure
      const response = await app.inject({
        method: 'GET',
        url: '/hello'
      })

      expect(response.statusCode).toBe(200)
    })
  })
})
