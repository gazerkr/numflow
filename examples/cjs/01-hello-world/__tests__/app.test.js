const numflow = require('../../../dist/cjs/index.js')

describe('01-hello-world', () => {
  let app

  beforeEach(() => {
    app = numflow()
  })

  afterEach(async () => {
    if (app && app.server) {
      await new Promise((resolve) => app.server.close(resolve))
    }
  })

  test('GET / returns "Hello World!"', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/'
    })

    expect(response.statusCode).toBe(200)
    expect(response.body).toBe('Hello World!')
  })

  test('GET /json returns JSON response', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/json'
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('application/json')

    const data = JSON.parse(response.body)
    expect(data).toEqual({
      message: 'Hello Numflow!',
      framework: 'Numflow'
    })
  })
})
