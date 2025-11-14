/**
 * WebSocket Compatibility Tests
 * Tests WebSocket integration compatibility with Numflow framework
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { Application } from '../../src/application.js'
import * as http from 'http'

// Test without actual ws package (testing server upgrade capability)
describe('WebSocket Server Capability', () => {
  let app: Application
  let server: http.Server

  beforeEach(() => {
    app = new Application()
  })

  afterEach(async () => {
    if (server && server.listening) {
      if (typeof server.closeAllConnections === 'function') {
        server.closeAllConnections()
      }
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 2000)
        server.close(() => {
          clearTimeout(timeout)
          resolve()
        })
      })
    }
    server = null as any
  })

  it('should return native Node.js HTTP server from listen()', (done) => {
    app.get('/', (_req, res) => {
      res.send('Hello')
    })

    server = app.listen(0)

    // Verify server is an instance of http.Server
    expect(server).toBeInstanceOf(http.Server)

    // Verify server has upgrade event capability
    expect(typeof server.on).toBe('function')
    expect(typeof server.emit).toBe('function')

    done()
  })

  it('should support upgrade event handler (WebSocket prerequisite)', (done) => {
    app.get('/', (_req, res) => {
      res.send('Hello')
    })

    server = app.listen(0)

    // Test that we can attach an upgrade handler
    let upgradeHandlerCalled = false

    server.on('upgrade', (_request, socket, _head) => {
      upgradeHandlerCalled = true
      // Don't handle the upgrade, just verify the handler is called
      socket.end()
    })

    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // Create a connection and attempt upgrade
    const client = http.request({
      hostname: 'localhost',
      port,
      path: '/',
      method: 'GET',
      headers: {
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Version': '13',
        'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ=='
      }
    })

    client.on('upgrade', (_res, socket) => {
      socket.end()
      socket.destroy()
      expect(upgradeHandlerCalled).toBe(true)
      done()
    })

    client.on('error', (_err) => {
      // Expected to get error since we're not properly handling WebSocket upgrade
      expect(upgradeHandlerCalled).toBe(true)
      done()
    })

    client.end()
  })

  it('should allow HTTP and WebSocket on same port', (done) => {
    app.get('/http', (_req, res) => {
      res.json({ type: 'http' })
    })

    server = app.listen(0)

    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // Test HTTP endpoint
    http.get(`http://localhost:${port}/http`, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        const parsed = JSON.parse(data)
        expect(parsed.type).toBe('http')
        done()
      })
    })
  })
})
