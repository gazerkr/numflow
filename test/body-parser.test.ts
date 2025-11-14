/**
 * Body Parser Tests

 */

import { IncomingMessage } from 'http'
import { EventEmitter } from 'events'
import { json, urlencoded, raw, text } from '../src/body-parser'

describe('Body Parser', () => {
  describe('JSON Parser', () => {
    it('should parse valid JSON', async () => {
      const req = createMockRequest(
        JSON.stringify({ name: 'John', age: 30 }),
        'application/json'
      )

      await json()(req)

      expect(req.body).toEqual({ name: 'John', age: 30 })
    })

    it('should handle empty JSON object', async () => {
      const req = createMockRequest('', 'application/json')

      await json()(req)

      expect(req.body).toEqual({})
    })

    it('should parse JSON array', async () => {
      const req = createMockRequest(
        JSON.stringify([1, 2, 3, 4, 5]),
        'application/json'
      )

      await json()(req)

      expect(req.body).toEqual([1, 2, 3, 4, 5])
    })

    it('should throw error for invalid JSON', async () => {
      const req = createMockRequest(
        '{ invalid json }',
        'application/json'
      )

      await expect(json()(req)).rejects.toThrow('Invalid JSON')
    })

    it('should not parse when Content-Type is not application/json', async () => {
      const req = createMockRequest(
        JSON.stringify({ name: 'John' }),
        'text/plain'
      )

      await json()(req)

      expect(req.body).toBeUndefined()
    })

    it('should throw error when body size exceeds limit', async () => {
      const largeBody = JSON.stringify({ data: 'x'.repeat(10000) })
      const req = createMockRequest(largeBody, 'application/json')

      await expect(json({ limit: 100 })(req)).rejects.toThrow('exceeds limit')
    })

    it('should throw error for primitive value in strict mode', async () => {
      const req = createMockRequest('123', 'application/json')

      await expect(json({ strict: true })(req)).rejects.toThrow('Strict mode')
    })

    it('should allow primitive value when strict mode is false', async () => {
      const req = createMockRequest('123', 'application/json')

      await json({ strict: false })(req)

      expect(req.body).toBe(123)
    })

    it('should skip when body is already parsed', async () => {
      const req = createMockRequest(
        JSON.stringify({ name: 'John' }),
        'application/json'
      )
      req.body = { existing: 'data' }

      await json()(req)

      expect(req.body).toEqual({ existing: 'data' })
    })

    it('should handle Content-Type with charset', async () => {
      const req = createMockRequest(
        JSON.stringify({ name: 'John' }),
        'application/json; charset=utf-8'
      )

      await json()(req)

      expect(req.body).toEqual({ name: 'John' })
    })

    it('should parse nested objects', async () => {
      const req = createMockRequest(
        JSON.stringify({
          user: {
            name: 'John',
            address: {
              city: 'Seoul',
              country: 'Korea',
            },
          },
        }),
        'application/json'
      )

      await json()(req)

      expect(req.body.user.name).toBe('John')
      expect(req.body.user.address.city).toBe('Seoul')
    })

    it('should parse string form of limit (1mb)', async () => {
      const req = createMockRequest(
        JSON.stringify({ data: 'x'.repeat(100) }),
        'application/json'
      )

      await json({ limit: '1mb' })(req)

      expect(req.body).toBeDefined()
    })

    it('should parse string form of limit (500kb)', async () => {
      const req = createMockRequest(
        JSON.stringify({ data: 'x'.repeat(100) }),
        'application/json'
      )

      await json({ limit: '500kb' })(req)

      expect(req.body).toBeDefined()
    })

    it('should remove UTF-8 BOM (RFC 8259 Section 8.1)', async () => {
      // UTF-8 BOM: 0xEF 0xBB 0xBF (U+FEFF)
      const jsonWithBOM = '\uFEFF{"name":"John","age":30}'
      const req = createMockRequest(jsonWithBOM, 'application/json')

      await json()(req)

      expect(req.body).toEqual({ name: 'John', age: 30 })
    })

    it('should handle JSON with UTF-8 BOM and nested objects', async () => {
      const jsonWithBOM = '\uFEFF{"user":{"name":"John","address":{"city":"Seoul"}}}'
      const req = createMockRequest(jsonWithBOM, 'application/json')

      await json()(req)

      expect(req.body.user.name).toBe('John')
      expect(req.body.user.address.city).toBe('Seoul')
    })

    it('should not fail on multiple BOMs (edge case)', async () => {
      // Edge case: multiple BOMs (should remove first one only)
      const jsonWithMultipleBOMs = '\uFEFF\uFEFF{"value":"test"}'
      const req = createMockRequest(jsonWithMultipleBOMs, 'application/json')

      // This might fail depending on implementation
      // JSON.parse('\uFEFF{"value":"test"}') will fail
      await expect(json()(req)).rejects.toThrow('Invalid JSON')
    })
  })

  describe('URL-encoded Parser', () => {
    it('should parse valid URL-encoded data', async () => {
      const req = createMockRequest(
        'name=John&age=30&city=Seoul',
        'application/x-www-form-urlencoded'
      )

      await urlencoded()(req)

      expect(req.body).toEqual({
        name: 'John',
        age: '30',
        city: 'Seoul',
      })
    })

    it('should handle empty body', async () => {
      const req = createMockRequest(
        '',
        'application/x-www-form-urlencoded'
      )

      await urlencoded()(req)

      expect(req.body).toEqual({})
    })

    it('should decode URL encoding', async () => {
      const req = createMockRequest(
        'message=Hello%20World&emoji=%F0%9F%98%80',
        'application/x-www-form-urlencoded'
      )

      await urlencoded()(req)

      expect(req.body.message).toBe('Hello World')
      expect(req.body.emoji).toBe('😀')
    })

    it('should convert + to space (application/x-www-form-urlencoded standard)', async () => {
      const req = createMockRequest(
        'name=John+Doe&city=New+York&country=South+Korea',
        'application/x-www-form-urlencoded'
      )

      await urlencoded()(req)

      expect(req.body.name).toBe('John Doe')
      expect(req.body.city).toBe('New York')
      expect(req.body.country).toBe('South Korea')
    })

    it('should handle mixed encoding (+ and %20)', async () => {
      const req = createMockRequest(
        'msg1=Hello+World&msg2=Hello%20World&msg3=Hello%2BWorld',
        'application/x-www-form-urlencoded'
      )

      await urlencoded()(req)

      expect(req.body.msg1).toBe('Hello World')  // + → space
      expect(req.body.msg2).toBe('Hello World')  // %20 → space
      expect(req.body.msg3).toBe('Hello+World')  // %2B → literal +
    })

    it('should support array notation (key[])', async () => {
      const req = createMockRequest(
        'tags[]=javascript&tags[]=typescript&tags[]=nodejs',
        'application/x-www-form-urlencoded'
      )

      await urlencoded()(req)

      expect(req.body.tags).toEqual(['javascript', 'typescript', 'nodejs'])
    })

    it('should not parse when Content-Type doesn\'t match', async () => {
      const req = createMockRequest(
        'name=John&age=30',
        'application/json'
      )

      await urlencoded()(req)

      expect(req.body).toBeUndefined()
    })

    it('should throw error when body size exceeds limit', async () => {
      const largeBody = 'data=' + 'x'.repeat(10000)
      const req = createMockRequest(
        largeBody,
        'application/x-www-form-urlencoded'
      )

      try {
        await urlencoded({ limit: 100 })(req)
        fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).toContain('exceeds limit')
        expect(err.status).toBe(413)
        expect(err.type).toBe('entity.too.large')
      }
    })

    it('should skip when body is already parsed', async () => {
      const req = createMockRequest(
        'name=John',
        'application/x-www-form-urlencoded'
      )
      req.body = { existing: 'data' }

      await urlencoded()(req)

      expect(req.body).toEqual({ existing: 'data' })
    })

    it('should handle empty values', async () => {
      const req = createMockRequest(
        'name=&age=30',
        'application/x-www-form-urlencoded'
      )

      await urlencoded()(req)

      expect(req.body).toEqual({
        name: '',
        age: '30',
      })
    })

    it('should correctly decode special characters', async () => {
      const req = createMockRequest(
        'email=test%40example.com&url=https%3A%2F%2Fexample.com',
        'application/x-www-form-urlencoded'
      )

      await urlencoded()(req)

      expect(req.body.email).toBe('test@example.com')
      expect(req.body.url).toBe('https://example.com')
    })

    it('should handle Content-Type with charset', async () => {
      const req = createMockRequest(
        'name=John&age=30',
        'application/x-www-form-urlencoded; charset=utf-8'
      )

      await urlencoded()(req)

      expect(req.body).toEqual({
        name: 'John',
        age: '30',
      })
    })

    it('should use last value when same key appears multiple times', async () => {
      const req = createMockRequest(
        'name=John&name=Jane&name=Bob',
        'application/x-www-form-urlencoded'
      )

      await urlencoded()(req)

      // Use last value if not array notation
      expect(req.body.name).toBe('Bob')
    })

    it('should parse string form of limit', async () => {
      const req = createMockRequest(
        'name=John&age=30',
        'application/x-www-form-urlencoded'
      )

      await urlencoded({ limit: '1mb' })(req)

      expect(req.body).toBeDefined()
    })

    // CVE-2024-45590: depth limit tests
    it('should reject body exceeding depth limit (CVE-2024-45590)', async () => {
      // Create nested object with depth 33 (exceeds default limit of 32)
      // a[b][c][d]...[z] = value (33 levels deep)
      const deepKeys = Array.from({ length: 33 }, (_, i) => `level${i}`)
      const deepBody = deepKeys.reduce((acc, key, i) => {
        if (i === 0) return `${key}[`
        if (i === deepKeys.length - 1) return acc + key + ']=value'
        return acc + key + ']['
      }, '')

      const req = createMockRequest(
        deepBody,
        'application/x-www-form-urlencoded'
      )

      try {
        await urlencoded({ depth: 32 })(req)
        fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).toContain('Request body depth exceeds limit of 32')
        expect(err.status).toBe(400)
        expect(err.type).toBe('parameters.depth.exceeded')
      }
    })

    it('should accept body within depth limit', async () => {
      // Create nested object with depth 5 (within limit)
      const req = createMockRequest(
        'user[profile][contact][email][primary]=test@example.com',
        'application/x-www-form-urlencoded'
      )

      await urlencoded({ depth: 32 })(req)

      expect(req.body.user.profile.contact.email.primary).toBe('test@example.com')
    })

    it('should use default depth limit of 32', async () => {
      // Create nested object with depth 33 (exceeds default)
      const deepKeys = Array.from({ length: 33 }, (_, i) => `level${i}`)
      const deepBody = deepKeys.reduce((acc, key, i) => {
        if (i === 0) return `${key}[`
        if (i === deepKeys.length - 1) return acc + key + ']=value'
        return acc + key + ']['
      }, '')

      const req = createMockRequest(
        deepBody,
        'application/x-www-form-urlencoded'
      )

      // Default depth should be 32
      try {
        await urlencoded()(req)
        fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).toContain('Request body depth exceeds limit of 32')
        expect(err.status).toBe(400)
        expect(err.type).toBe('parameters.depth.exceeded')
      }
    })

    it('should allow custom depth limit', async () => {
      // Create nested object with depth 10
      const req = createMockRequest(
        'a[b][c][d][e][f][g][h][i][j]=value',
        'application/x-www-form-urlencoded'
      )

      // Set lower depth limit of 5
      try {
        await urlencoded({ depth: 5 })(req)
        fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).toContain('Request body depth exceeds limit of 5')
        expect(err.status).toBe(400)
        expect(err.type).toBe('parameters.depth.exceeded')
      }
    })

    // parameterLimit tests
    it('should reject body exceeding parameter limit', async () => {
      // Create 1001 parameters (exceeds default limit of 1000)
      const params = Array.from({ length: 1001 }, (_, i) => `param${i}=value${i}`).join('&')
      const req = createMockRequest(
        params,
        'application/x-www-form-urlencoded'
      )

      try {
        await urlencoded({ parameterLimit: 1000 })(req)
        fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).toContain('Request parameters exceed limit of 1000')
        expect(err.status).toBe(413)
        expect(err.type).toBe('parameters.too.many')
      }
    })

    it('should accept body within parameter limit', async () => {
      // Create 100 parameters (within limit)
      const params = Array.from({ length: 100 }, (_, i) => `param${i}=value${i}`).join('&')
      const req = createMockRequest(
        params,
        'application/x-www-form-urlencoded'
      )

      await urlencoded({ parameterLimit: 1000 })(req)

      expect(req.body.param0).toBe('value0')
      expect(req.body.param99).toBe('value99')
      expect(Object.keys(req.body).length).toBe(100)
    })

    it('should use default parameter limit of 1000', async () => {
      // Create 1001 parameters (exceeds default)
      const params = Array.from({ length: 1001 }, (_, i) => `param${i}=value${i}`).join('&')
      const req = createMockRequest(
        params,
        'application/x-www-form-urlencoded'
      )

      // Default parameterLimit should be 1000
      try {
        await urlencoded()(req)
        fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).toContain('Request parameters exceed limit of 1000')
        expect(err.status).toBe(413)
        expect(err.type).toBe('parameters.too.many')
      }
    })

    it('should allow custom parameter limit', async () => {
      // Create 51 parameters
      const params = Array.from({ length: 51 }, (_, i) => `param${i}=value${i}`).join('&')
      const req = createMockRequest(
        params,
        'application/x-www-form-urlencoded'
      )

      // Set lower limit of 50
      try {
        await urlencoded({ parameterLimit: 50 })(req)
        fail('Should have thrown')
      } catch (err: any) {
        expect(err.message).toContain('Request parameters exceed limit of 50')
        expect(err.status).toBe(413)
        expect(err.type).toBe('parameters.too.many')
      }
    })
  })

  describe('Body Parser Options', () => {
    it('should support numeric limit', async () => {
      const req = createMockRequest(
        JSON.stringify({ data: 'test' }),
        'application/json'
      )

      await json({ limit: 1000 })(req)

      expect(req.body).toBeDefined()
    })

    it('should throw error for invalid limit format', async () => {
      expect(() => {
        json({ limit: 'invalid' as any })
      }).toThrow('Invalid body size limit')
    })
  })

  describe('Raw Body Parser', () => {
    it('should parse binary data as Buffer', async () => {
      const binaryData = Buffer.from([0x89, 0x50, 0x4e, 0x47]) // PNG header
      const req = createMockRequestWithBuffer(
        binaryData,
        'application/octet-stream'
      )

      await raw()(req)

      expect(req.body).toBeInstanceOf(Buffer)
      expect(req.body).toEqual(binaryData)
    })

    it('should handle image/* Content-Type', async () => {
      const imageData = Buffer.from('fake-image-data')
      const req = createMockRequestWithBuffer(imageData, 'image/png')

      await raw()(req)

      expect(req.body).toBeInstanceOf(Buffer)
      expect(req.body.toString()).toBe('fake-image-data')
    })

    it('should handle video/* Content-Type', async () => {
      const videoData = Buffer.from('fake-video-data')
      const req = createMockRequestWithBuffer(videoData, 'video/mp4')

      await raw()(req)

      expect(req.body).toBeInstanceOf(Buffer)
    })

    it('should handle audio/* Content-Type', async () => {
      const audioData = Buffer.from('fake-audio-data')
      const req = createMockRequestWithBuffer(audioData, 'audio/mpeg')

      await raw()(req)

      expect(req.body).toBeInstanceOf(Buffer)
    })

    it('should handle application/* Content-Type', async () => {
      const data = Buffer.from('some-application-data')
      const req = createMockRequestWithBuffer(data, 'application/pdf')

      await raw()(req)

      expect(req.body).toBeInstanceOf(Buffer)
    })

    it('should not handle text/* Content-Type', async () => {
      const data = Buffer.from('text data')
      const req = createMockRequestWithBuffer(data, 'text/plain')

      await raw()(req)

      expect(req.body).toBeUndefined()
    })

    it('should throw error when body size exceeds limit', async () => {
      const largeData = Buffer.alloc(10000)
      const req = createMockRequestWithBuffer(
        largeData,
        'application/octet-stream'
      )

      await expect(raw({ limit: 100 })(req)).rejects.toThrow('exceeds limit')
    })

    it('should skip when body is already parsed', async () => {
      const data = Buffer.from('test')
      const req = createMockRequestWithBuffer(
        data,
        'application/octet-stream'
      )
      req.body = { existing: 'data' }

      await raw()(req)

      expect(req.body).toEqual({ existing: 'data' })
    })

    it('should handle empty body', async () => {
      const req = createMockRequestWithBuffer(
        Buffer.from(''),
        'application/octet-stream'
      )

      await raw()(req)

      expect(req.body).toBeInstanceOf(Buffer)
      expect(req.body.length).toBe(0)
    })

    it('should parse string form of limit', async () => {
      const data = Buffer.from('test data')
      const req = createMockRequestWithBuffer(
        data,
        'application/octet-stream'
      )

      await raw({ limit: '1mb' })(req)

      expect(req.body).toBeDefined()
    })
  })

  describe('Text Body Parser', () => {
    it('should parse text/plain as UTF-8 string', async () => {
      const req = createMockRequest('Hello, World!', 'text/plain')

      await text()(req)

      expect(req.body).toBe('Hello, World!')
    })

    it('should handle text/* Content-Type', async () => {
      const req = createMockRequest('<html><body>Test</body></html>', 'text/html')

      await text()(req)

      expect(req.body).toBe('<html><body>Test</body></html>')
    })

    it('should correctly decode UTF-8 characters', async () => {
      const req = createMockRequest('안녕하세요 😀', 'text/plain')

      await text()(req)

      expect(req.body).toBe('안녕하세요 😀')
    })

    it('should not handle application/* Content-Type', async () => {
      const req = createMockRequest('{"test": "data"}', 'application/json')

      await text()(req)

      expect(req.body).toBeUndefined()
    })

    it('should handle empty body', async () => {
      const req = createMockRequest('', 'text/plain')

      await text()(req)

      expect(req.body).toBe('')
    })

    it('should throw error when body size exceeds limit', async () => {
      const largeText = 'x'.repeat(10000)
      const req = createMockRequest(largeText, 'text/plain')

      await expect(text({ limit: 100 })(req)).rejects.toThrow('exceeds limit')
    })

    it('should skip when body is already parsed', async () => {
      const req = createMockRequest('test', 'text/plain')
      req.body = { existing: 'data' }

      await text()(req)

      expect(req.body).toEqual({ existing: 'data' })
    })

    it('should handle multi-line text', async () => {
      const multilineText = 'Line 1\nLine 2\nLine 3'
      const req = createMockRequest(multilineText, 'text/plain')

      await text()(req)

      expect(req.body).toBe(multilineText)
    })

    it('should handle Content-Type with charset', async () => {
      const req = createMockRequest('Hello', 'text/plain; charset=utf-8')

      await text()(req)

      expect(req.body).toBe('Hello')
    })

    it('should parse string form of limit', async () => {
      const req = createMockRequest('test', 'text/plain')

      await text({ limit: '1mb' })(req)

      expect(req.body).toBeDefined()
    })

    it('should remove UTF-8 BOM (RFC 3629)', async () => {
      // UTF-8 BOM: U+FEFF
      const textWithBOM = '\uFEFFHello, World!'
      const req = createMockRequest(textWithBOM, 'text/plain')

      await text()(req)

      expect(req.body).toBe('Hello, World!')
      expect(req.body).not.toContain('\uFEFF')
    })

    it('should handle text with UTF-8 BOM and special characters', async () => {
      const textWithBOM = '\uFEFF안녕하세요 😀'
      const req = createMockRequest(textWithBOM, 'text/plain')

      await text()(req)

      expect(req.body).toBe('안녕하세요 😀')
    })

    it('should handle multiline text with BOM', async () => {
      const textWithBOM = '\uFEFFLine 1\nLine 2\nLine 3'
      const req = createMockRequest(textWithBOM, 'text/plain')

      await text()(req)

      expect(req.body).toBe('Line 1\nLine 2\nLine 3')
    })

    it('should respect charset parameter (RFC 7231 Section 3.1.1.1)', async () => {
      // ISO-8859-1 (Latin-1) encoded text with special characters
      // "café" in Latin-1: c=0x63, a=0x61, f=0x66, é=0xE9
      const latin1Buffer = Buffer.from([0x63, 0x61, 0x66, 0xE9])
      const req = createMockRequestWithBuffer(
        latin1Buffer,
        'text/plain; charset=iso-8859-1'
      )

      await text()(req)

      expect(req.body).toBe('café')
    })

    it('should handle latin1 charset (alias)', async () => {
      const latin1Buffer = Buffer.from([0x48, 0x65, 0x6C, 0x6C, 0x6F, 0xE9]) // "Helloé"
      const req = createMockRequestWithBuffer(
        latin1Buffer,
        'text/plain; charset=latin1'
      )

      await text()(req)

      expect(req.body).toBe('Helloé')
    })

    it('should default to utf-8 if charset not specified', async () => {
      const req = createMockRequest('안녕하세요', 'text/plain')

      await text()(req)

      expect(req.body).toBe('안녕하세요')
    })

    it('should default to utf-8 for unsupported charset', async () => {
      // Unsupported charset should fallback to UTF-8
      const req = createMockRequest('Hello', 'text/plain; charset=unsupported-encoding')

      await text()(req)

      expect(req.body).toBe('Hello')
    })

    it('should handle ASCII charset', async () => {
      const asciiBuffer = Buffer.from('Hello World', 'ascii')
      const req = createMockRequestWithBuffer(
        asciiBuffer,
        'text/plain; charset=us-ascii'
      )

      await text()(req)

      expect(req.body).toBe('Hello World')
    })
  })
})

/**
 * Mock request creation helper (string body)
 */
function createMockRequest(body: string, contentType: string): any {
  const emitter = new EventEmitter()

  const req: any = Object.assign(emitter, {
    headers: {
      'content-type': contentType,
    },
    body: undefined,
  })

  // Emit data/end events asynchronously
  setImmediate(() => {
    const buffer = Buffer.from(body, 'utf-8')
    req.emit('data', buffer)
    req.emit('end')
  })

  return req as IncomingMessage & { body?: any }
}

/**
 * Mock request creation helper (Buffer body)
 */
function createMockRequestWithBuffer(body: Buffer, contentType: string): any {
  const emitter = new EventEmitter()

  const req: any = Object.assign(emitter, {
    headers: {
      'content-type': contentType,
    },
    body: undefined,
  })

  // Emit data/end events asynchronously
  setImmediate(() => {
    req.emit('data', body)
    req.emit('end')
  })

  return req as IncomingMessage & { body?: any }
}
