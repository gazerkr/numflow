/**
 * Static file serving middleware tests
 * Tests for numflow.static() / express.static() compatibility
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals'
import * as fs from 'fs'
import * as path from 'path'
import numflow from '../src/index.js'
import request from 'supertest'

describe('numflow.static()', () => {
  const fixturesDir = path.join(__dirname, 'fixtures', 'static')

  beforeAll(() => {
    // Create test fixtures
    if (!fs.existsSync(fixturesDir)) {
      fs.mkdirSync(fixturesDir, { recursive: true })
    }

    // Create test files
    fs.writeFileSync(path.join(fixturesDir, 'test.txt'), 'Hello Static')
    fs.writeFileSync(path.join(fixturesDir, 'test.html'), '<html><body>Test HTML</body></html>')
    fs.writeFileSync(path.join(fixturesDir, 'test.json'), '{"message":"test"}')
    fs.writeFileSync(path.join(fixturesDir, 'test.css'), 'body { color: red; }')
    fs.writeFileSync(path.join(fixturesDir, 'test.js'), 'console.log("test")')

    // Create subdirectory
    const subDir = path.join(fixturesDir, 'sub')
    if (!fs.existsSync(subDir)) {
      fs.mkdirSync(subDir)
    }
    fs.writeFileSync(path.join(subDir, 'nested.txt'), 'Nested File')
  })

  afterAll(() => {
    // Clean up test fixtures
    if (fs.existsSync(fixturesDir)) {
      fs.rmSync(fixturesDir, { recursive: true, force: true })
    }
  })

  it('should serve static files', async () => {
    const app = numflow()
    app.use(numflow.static(fixturesDir))

    const server = app.listen(0)
    const port = (server.address() as any).port

    try {
      const response = await request(`http://localhost:${port}`)
        .get('/test.txt')
        .expect(200)

      expect(response.text).toBe('Hello Static')
      expect(response.headers['content-type']).toContain('text/plain')
    } finally {
      server.close()
    }
  })

  it('should serve HTML files', async () => {
    const app = numflow()
    app.use(numflow.static(fixturesDir))

    const server = app.listen(0)
    const port = (server.address() as any).port

    try {
      const response = await request(`http://localhost:${port}`)
        .get('/test.html')
        .expect(200)

      expect(response.text).toContain('Test HTML')
      expect(response.headers['content-type']).toContain('text/html')
    } finally {
      server.close()
    }
  })

  it('should serve JSON files', async () => {
    const app = numflow()
    app.use(numflow.static(fixturesDir))

    const server = app.listen(0)
    const port = (server.address() as any).port

    try {
      const response = await request(`http://localhost:${port}`)
        .get('/test.json')
        .expect(200)

      expect(response.body).toEqual({ message: 'test' })
      expect(response.headers['content-type']).toContain('application/json')
    } finally {
      server.close()
    }
  })

  it('should serve CSS files', async () => {
    const app = numflow()
    app.use(numflow.static(fixturesDir))

    const server = app.listen(0)
    const port = (server.address() as any).port

    try {
      const response = await request(`http://localhost:${port}`)
        .get('/test.css')
        .expect(200)

      expect(response.text).toContain('color: red')
      expect(response.headers['content-type']).toContain('text/css')
    } finally {
      server.close()
    }
  })

  it('should serve JavaScript files', async () => {
    const app = numflow()
    app.use(numflow.static(fixturesDir))

    const server = app.listen(0)
    const port = (server.address() as any).port

    try {
      const response = await request(`http://localhost:${port}`)
        .get('/test.js')
        .expect(200)

      expect(response.text).toContain('console.log')
      expect(response.headers['content-type']).toMatch(/javascript|text\/plain/)
    } finally {
      server.close()
    }
  })

  it('should serve files from subdirectories', async () => {
    const app = numflow()
    app.use(numflow.static(fixturesDir))

    const server = app.listen(0)
    const port = (server.address() as any).port

    try {
      const response = await request(`http://localhost:${port}`)
        .get('/sub/nested.txt')
        .expect(200)

      expect(response.text).toBe('Nested File')
    } finally {
      server.close()
    }
  })

  it('should return 404 for non-existent files', async () => {
    const app = numflow()
    app.use(numflow.static(fixturesDir))

    app.get('*', (_req, res) => {
      res.status(404).send('Not Found')
    })

    const server = app.listen(0)
    const port = (server.address() as any).port

    try {
      const response = await request(`http://localhost:${port}`)
        .get('/nonexistent.txt')
        .expect(404)

      expect(response.text).toBe('Not Found')
    } finally {
      server.close()
    }
  })

  it('should serve from mounted path', async () => {
    const app = numflow()
    app.use('/public', numflow.static(fixturesDir))

    const server = app.listen(0)
    const port = (server.address() as any).port

    try {
      const response = await request(`http://localhost:${port}`)
        .get('/public/test.txt')
        .expect(200)

      expect(response.text).toBe('Hello Static')
    } finally {
      server.close()
    }
  })

  it('should support index.html option', async () => {
    const indexDir = path.join(fixturesDir, 'index-test')
    fs.mkdirSync(indexDir, { recursive: true })
    fs.writeFileSync(path.join(indexDir, 'index.html'), '<html>Index Page</html>')

    const app = numflow()
    app.use(numflow.static(indexDir))

    const server = app.listen(0)
    const port = (server.address() as any).port

    try {
      const response = await request(`http://localhost:${port}`)
        .get('/')
        .expect(200)

      expect(response.text).toContain('Index Page')
      expect(response.headers['content-type']).toContain('text/html')
    } finally {
      server.close()
      fs.rmSync(indexDir, { recursive: true, force: true })
    }
  })

  it('should prevent directory traversal attacks', async () => {
    const app = numflow()
    app.use(numflow.static(fixturesDir))

    app.get('*', (_req, res) => {
      res.status(404).send('Not Found')
    })

    const server = app.listen(0)
    const port = (server.address() as any).port

    try {
      // Try to access parent directory
      const response = await request(`http://localhost:${port}`)
        .get('/../../../package.json')
        .expect(404)

      expect(response.text).toBe('Not Found')
    } finally {
      server.close()
    }
  })

  it('should support dotfiles option', async () => {
    const dotfileDir = path.join(fixturesDir, 'dotfiles')
    fs.mkdirSync(dotfileDir, { recursive: true })
    fs.writeFileSync(path.join(dotfileDir, '.hidden'), 'Hidden File')

    const app = numflow()
    app.use(numflow.static(dotfileDir, { dotfiles: 'allow' }))

    const server = app.listen(0)
    const port = (server.address() as any).port

    try {
      const response = await request(`http://localhost:${port}`)
        .get('/.hidden')
        .expect(200)

      // For dotfiles without extension, content is in body as Buffer
      const content = response.text || response.body.toString()
      expect(content).toBe('Hidden File')
    } finally {
      server.close()
      fs.rmSync(dotfileDir, { recursive: true, force: true })
    }
  })

  it('should ignore dotfiles by default', async () => {
    const dotfileDir = path.join(fixturesDir, 'dotfiles-ignore')
    fs.mkdirSync(dotfileDir, { recursive: true })
    fs.writeFileSync(path.join(dotfileDir, '.hidden'), 'Hidden File')

    const app = numflow()
    app.use(numflow.static(dotfileDir)) // No dotfiles option

    app.get('*', (_req, res) => {
      res.status(404).send('Not Found')
    })

    const server = app.listen(0)
    const port = (server.address() as any).port

    try {
      const response = await request(`http://localhost:${port}`)
        .get('/.hidden')
        .expect(404)

      expect(response.text).toBe('Not Found')
    } finally {
      server.close()
      fs.rmSync(dotfileDir, { recursive: true, force: true })
    }
  })

  describe('With inject()', () => {
    it('should serve static files with inject()', async () => {
      const app = numflow()
      app.use(numflow.static(fixturesDir))

      const response = await app.inject({
        method: 'GET',
        url: '/test.txt',
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toBe('Hello Static')
      expect(response.headers['content-type']).toContain('text/plain')
    })

    it('should serve HTML files with inject()', async () => {
      const app = numflow()
      app.use(numflow.static(fixturesDir))

      const response = await app.inject({
        method: 'GET',
        url: '/test.html',
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Test HTML')
      expect(response.headers['content-type']).toContain('text/html')
    })

    it('should serve JSON files with inject()', async () => {
      const app = numflow()
      app.use(numflow.static(fixturesDir))

      const response = await app.inject({
        method: 'GET',
        url: '/test.json',
      })

      expect(response.statusCode).toBe(200)
      const json = JSON.parse(response.payload)
      expect(json).toEqual({ message: 'test' })
      expect(response.headers['content-type']).toContain('application/json')
    })

    it('should serve files from subdirectories with inject()', async () => {
      const app = numflow()
      app.use(numflow.static(fixturesDir))

      const response = await app.inject({
        method: 'GET',
        url: '/sub/nested.txt',
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toBe('Nested File')
    })

    it('should return 404 for non-existent files with inject()', async () => {
      const app = numflow()
      app.use(numflow.static(fixturesDir))

      app.get('*', (_req, res) => {
        res.status(404).send('Not Found')
      })

      const response = await app.inject({
        method: 'GET',
        url: '/nonexistent.txt',
      })

      expect(response.statusCode).toBe(404)
      expect(response.payload).toBe('Not Found')
    })

    it('should serve from mounted path with inject()', async () => {
      const app = numflow()
      app.use('/public', numflow.static(fixturesDir))

      const response = await app.inject({
        method: 'GET',
        url: '/public/test.txt',
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toBe('Hello Static')
    })

    it('should serve index.html with inject()', async () => {
      const indexDir = path.join(fixturesDir, 'index-inject')
      fs.mkdirSync(indexDir, { recursive: true })
      fs.writeFileSync(path.join(indexDir, 'index.html'), '<html>Index with inject</html>')

      const app = numflow()
      app.use(numflow.static(indexDir))

      try {
        const response = await app.inject({
          method: 'GET',
          url: '/',
        })

        expect(response.statusCode).toBe(200)
        expect(response.payload).toContain('Index with inject')
        expect(response.headers['content-type']).toContain('text/html')
      } finally {
        fs.rmSync(indexDir, { recursive: true, force: true })
      }
    })

    it('should prevent directory traversal with inject()', async () => {
      const app = numflow()
      app.use(numflow.static(fixturesDir))

      app.get('*', (_req, res) => {
        res.status(404).send('Not Found')
      })

      const response = await app.inject({
        method: 'GET',
        url: '/../../../package.json',
      })

      expect(response.statusCode).toBe(404)
      expect(response.payload).toBe('Not Found')
    })
  })
})
