/**
 * Socket.IO Integration Tests
 * Tests Socket.IO integration with Numflow framework (Express.js compatible)
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { Application } from '../../src/application.js'
import { Server as SocketIOServer } from 'socket.io'
import { io as ioClient } from 'socket.io-client'
import * as http from 'http'

describe('Socket.IO Integration', () => {
  let app: Application
  let server: http.Server
  let io: SocketIOServer

  beforeEach(() => {
    app = new Application()
  })

  afterEach(async () => {
    // Close Socket.IO first
    if (io) {
      await new Promise<void>((resolve) => {
        io.close(() => resolve())
      })
      io = null as any
    }

    // Then close HTTP server
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

  it('should support Socket.IO (Express.js pattern)', (done) => {
    // HTTP route
    app.get('/', (_req, res) => {
      res.send('Hello HTTP')
    })

    // Start server
    server = app.listen(0)

    // Attach Socket.IO to HTTP server (Express.js pattern)
    io = new SocketIOServer(server)

    io.on('connection', (socket) => {
      socket.on('message', (msg) => {
        socket.emit('response', `Echo: ${msg}`)
      })
    })

    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // Client connection
    const client = ioClient(`http://localhost:${port}`)

    client.on('connect', () => {
      client.emit('message', 'Hello Socket.IO')
    })

    client.on('response', (data) => {
      expect(data).toBe('Echo: Hello Socket.IO')
      client.close()
      done()
    })

    client.on('connect_error', (err) => {
      done(err)
    })
  })

  it('should support Socket.IO rooms and broadcasting', (done) => {
    app.get('/', (_req, res) => {
      res.send('Hello')
    })

    server = app.listen(0)
    io = new SocketIOServer(server)

    io.on('connection', (socket) => {
      socket.on('join-room', (room) => {
        socket.join(room)
        socket.emit('joined', room)
      })

      socket.on('room-message', ({ room, message }) => {
        // Broadcast to room
        io.to(room).emit('room-broadcast', message)
      })
    })

    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    const client1 = ioClient(`http://localhost:${port}`)
    const client2 = ioClient(`http://localhost:${port}`)

    let client1Ready = false
    let client2Ready = false
    let client1Received = false
    let client2Received = false

    const checkDone = () => {
      if (client1Received && client2Received) {
        client1.close()
        client2.close()
        done()
      }
    }

    client1.on('joined', () => {
      client1Ready = true
      if (client1Ready && client2Ready) {
        client1.emit('room-message', { room: 'test-room', message: 'Hello room' })
      }
    })

    client2.on('joined', () => {
      client2Ready = true
      if (client1Ready && client2Ready) {
        client1.emit('room-message', { room: 'test-room', message: 'Hello room' })
      }
    })

    client1.on('room-broadcast', (msg) => {
      expect(msg).toBe('Hello room')
      client1Received = true
      checkDone()
    })

    client2.on('room-broadcast', (msg) => {
      expect(msg).toBe('Hello room')
      client2Received = true
      checkDone()
    })

    client1.emit('join-room', 'test-room')
    client2.emit('join-room', 'test-room')
  })

  it('should support both HTTP routes and Socket.IO', (done) => {
    // HTTP routes
    app.get('/api/status', (_req, res) => {
      res.json({ status: 'online' })
    })

    server = app.listen(0)
    io = new SocketIOServer(server)

    io.on('connection', (socket) => {
      socket.emit('welcome', 'Welcome to Socket.IO')
    })

    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // Test HTTP endpoint
    http.get(`http://localhost:${port}/api/status`, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        const parsed = JSON.parse(data)
        expect(parsed.status).toBe('online')

        // Then test Socket.IO
        const client = ioClient(`http://localhost:${port}`)

        client.on('welcome', (msg) => {
          expect(msg).toBe('Welcome to Socket.IO')
          client.close()
          done()
        })

        client.on('connect_error', done)
      })
    })
  })

  it('should support Socket.IO namespaces', (done) => {
    app.get('/', (_req, res) => {
      res.send('Hello')
    })

    server = app.listen(0)
    io = new SocketIOServer(server)

    // Chat namespace
    const chatNs = io.of('/chat')
    chatNs.on('connection', (socket) => {
      socket.emit('message', 'Welcome to chat')
    })

    // Notifications namespace
    const notifNs = io.of('/notifications')
    notifNs.on('connection', (socket) => {
      socket.emit('message', 'Welcome to notifications')
    })

    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    const chatClient = ioClient(`http://localhost:${port}/chat`)

    chatClient.on('message', (msg) => {
      expect(msg).toBe('Welcome to chat')
      chatClient.close()
      done()
    })

    chatClient.on('connect_error', done)
  })

  it('should support Socket.IO with authentication', (done) => {
    app.get('/', (_req, res) => {
      res.send('Hello')
    })

    server = app.listen(0)
    io = new SocketIOServer(server)

    // Middleware for authentication
    io.use((socket, next) => {
      const token = socket.handshake.auth.token
      if (token === 'valid-token') {
        next()
      } else {
        next(new Error('Authentication error'))
      }
    })

    io.on('connection', (socket) => {
      socket.emit('authenticated', 'You are authenticated')
    })

    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    // Client with valid token
    const validClient = ioClient(`http://localhost:${port}`, {
      auth: { token: 'valid-token' }
    })

    validClient.on('authenticated', (msg) => {
      expect(msg).toBe('You are authenticated')
      validClient.close()

      // Try with invalid token
      const invalidClient = ioClient(`http://localhost:${port}`, {
        auth: { token: 'invalid-token' }
      })

      invalidClient.on('connect', () => {
        invalidClient.close()
        done(new Error('Should not connect with invalid token'))
      })

      invalidClient.on('connect_error', (err) => {
        expect(err.message).toBe('Authentication error')
        invalidClient.close()
        done()
      })
    })

    validClient.on('connect_error', done)
  })
})
