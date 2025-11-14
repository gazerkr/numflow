/**
 * Method Override Compatibility Tests
 * Tests method-override middleware compatibility with Numflow framework
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { Application } from '../../src/application.js'
import { urlencoded } from '../../src/body-parser.js'
import methodOverride from 'method-override'
import * as http from 'http'

describe('Method Override Compatibility', () => {
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

  it('should override POST to DELETE using X-HTTP-Method-Override header', (done) => {
    // Use method-override with X-HTTP-Method-Override header
    app.use(methodOverride('X-HTTP-Method-Override'))

    app.delete('/users/:id', (req, res) => {
      res.json({ method: req.method, id: req.params!.id })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    const options = {
      hostname: 'localhost',
      port,
      path: '/users/123',
      method: 'POST',
      headers: {
        'X-HTTP-Method-Override': 'DELETE'
      }
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        const parsed = JSON.parse(data)
        expect(parsed.method).toBe('DELETE')
        expect(parsed.id).toBe('123')
        done()
      })
    })
    req.end()
  })

  it('should override POST to PUT using X-HTTP-Method-Override header', (done) => {
    app.use(methodOverride('X-HTTP-Method-Override'))

    app.put('/users/:id', (req, res) => {
      res.json({ method: req.method, id: req.params!.id })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    const options = {
      hostname: 'localhost',
      port,
      path: '/users/456',
      method: 'POST',
      headers: {
        'X-HTTP-Method-Override': 'PUT'
      }
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        const parsed = JSON.parse(data)
        expect(parsed.method).toBe('PUT')
        expect(parsed.id).toBe('456')
        done()
      })
    })
    req.end()
  })

  it('should override POST to DELETE using query string _method', (done) => {
    // Use method-override with query string
    app.use(methodOverride('_method'))

    app.delete('/users/:id', (req, res) => {
      res.json({ method: req.method, id: req.params!.id })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    const options = {
      hostname: 'localhost',
      port,
      path: '/users/789?_method=DELETE',
      method: 'POST'
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        const parsed = JSON.parse(data)
        expect(parsed.method).toBe('DELETE')
        expect(parsed.id).toBe('789')
        done()
      })
    })
    req.end()
  })

  it('should override POST to PATCH using X-HTTP-Method-Override header', (done) => {
    app.use(methodOverride('X-HTTP-Method-Override'))

    app.patch('/users/:id', (req, res) => {
      res.json({ method: req.method, id: req.params!.id })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    const options = {
      hostname: 'localhost',
      port,
      path: '/users/999',
      method: 'POST',
      headers: {
        'X-HTTP-Method-Override': 'PATCH'
      }
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        const parsed = JSON.parse(data)
        expect(parsed.method).toBe('PATCH')
        expect(parsed.id).toBe('999')
        done()
      })
    })
    req.end()
  })

  it('should not override when header is missing', (done) => {
    app.use(methodOverride('X-HTTP-Method-Override'))

    let methodReceived = ''
    app.post('/users', (req, res) => {
      methodReceived = req.method!
      res.json({ method: req.method })
    })

    app.delete('/users', (_req, res) => {
      res.json({ method: 'DELETE handler' })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    const options = {
      hostname: 'localhost',
      port,
      path: '/users',
      method: 'POST'
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        const parsed = JSON.parse(data)
        expect(parsed.method).toBe('POST')
        expect(methodReceived).toBe('POST')
        done()
      })
    })
    req.end()
  })

  it('should work with body-parser and form data', (done) => {
    app.use(urlencoded({ extended: true }))
    app.use(methodOverride((req: any) => {
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        const method = req.body._method
        delete req.body._method
        return method
      }
    }))

    app.put('/users/:id', (req, res) => {
      res.json({
        method: req.method,
        id: req.params!.id,
        name: req.body.name
      })
    })

    server = app.listen(0)
    const address = server.address()
    if (!address || typeof address === 'string') {
      done(new Error('Invalid server address'))
      return
    }
    const port = address.port

    const postData = '_method=PUT&name=John'
    const options = {
      hostname: 'localhost',
      port,
      path: '/users/111',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    const req = http.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        const parsed = JSON.parse(data)
        expect(parsed.method).toBe('PUT')
        expect(parsed.id).toBe('111')
        expect(parsed.name).toBe('John')
        done()
      })
    })
    req.write(postData)
    req.end()
  })
})
