/**
 * WebSocket Inject Test
 * Tests whether app.inject() can handle WebSocket upgrade requests
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { Application } from '../../src/application.js'
import { WebSocketServer } from 'ws'

describe('WebSocket with app.inject()', () => {
  let app: Application

  beforeEach(() => {
    app = new Application()
  })

  it('should attempt WebSocket upgrade using inject()', async () => {
    app.get('/', (_req, res) => {
      res.send('Hello')
    })

    // Try to inject WebSocket upgrade request
    const response = await app.inject({
      method: 'GET',
      url: '/',
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Version': '13',
        'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ=='
      }
    })

    // Check response
    console.log('Status Code:', response.statusCode)
    console.log('Headers:', response.headers)
    console.log('Payload:', response.payload)

    // Expectation: inject() cannot handle WebSocket upgrade
    // It will either:
    // 1. Return 404 (no route handler)
    // 2. Return 200 with normal response (ignores upgrade)
    // 3. Not handle the upgrade event

    expect(response.statusCode).toBeDefined()
  })

  it('should verify inject() limitation for WebSocket', async () => {
    app.get('/', (_req, res) => {
      res.send('Hello HTTP')
    })

    // Create a mock WebSocket server (but don't attach to real server)
    const wsServer = new WebSocketServer({ noServer: true })

    let upgradeHandlerCalled = false

    // This won't work with inject because there's no real server
    // @ts-ignore - accessing internal for testing
    if (app['server']) {
      app['server'].on('upgrade', () => {
        upgradeHandlerCalled = true
      })
    }

    // Try WebSocket upgrade via inject
    const response = await app.inject({
      method: 'GET',
      url: '/',
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Version': '13',
        'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ=='
      }
    })

    // Verify that upgrade handler was NOT called
    // because inject() doesn't create a real server
    expect(upgradeHandlerCalled).toBe(false)

    // Verify response is HTTP (not WebSocket upgrade)
    expect(response.statusCode).toBe(200)
    expect(response.headers['upgrade']).toBeUndefined()

    wsServer.close()
  })

  it('should demonstrate why real server is needed for WebSocket', async () => {
    // Reason 1: inject() uses light-my-request
    // light-my-request only handles HTTP request/response
    // It does NOT create a real socket connection

    // Reason 2: WebSocket requires:
    // - HTTP upgrade request (101 Switching Protocols)
    // - Bidirectional socket connection
    // - WebSocket protocol frames

    // Reason 3: inject() bypasses server.listen()
    // No real TCP connection = No WebSocket

    const httpResponse = await app.inject({
      method: 'GET',
      url: '/test'
    })

    // inject() works perfectly for HTTP
    expect(httpResponse.statusCode).toBe(404)

    // But for WebSocket, you MUST use real server:
    // const server = app.listen(0)
    // const ws = new WebSocket(`ws://localhost:${port}`)
  })
})
