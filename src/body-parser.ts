import { IncomingMessage } from 'http'

/**
 * Body Parser Options
 */
export interface BodyParserOptions {
  /**
   * Body size limit (default: 1mb)
   */
  limit?: number | string

  /**
   * Strict mode for JSON parsing (default: true)
   */
  strict?: boolean

  /**
   * Use extended query string parser (qs) for URL-encoded bodies
   * Accepted for Express compatibility (uses built-in parser)
   * Default: true
   */
  extended?: boolean

  /**
   * Maximum depth of nested objects/arrays in URL-encoded bodies
   * Mitigates CVE-2024-45590 (Default: 32)
   * Express.js 5.x compatible
   */
  depth?: number

  /**
   * Maximum number of parameters in URL-encoded bodies (Default: 1000)
   * Express.js 5.x compatible
   */
  parameterLimit?: number
}

/**
 * Parse body size limit string to bytes
 * Examples: '1mb' -> 1048576, '500kb' -> 512000
 */
function parseLimit(limit: number | string): number {
  if (typeof limit === 'number') {
    return limit
  }

  const match = /^(\d+(?:\.\d+)?)(kb|mb|gb)?$/i.exec(limit)
  if (!match) {
    throw new Error(`Invalid body size limit: ${limit}`)
  }

  const size = parseFloat(match[1])
  const unit = (match[2] || '').toLowerCase()

  switch (unit) {
    case 'kb':
      return Math.floor(size * 1024)
    case 'mb':
      return Math.floor(size * 1024 * 1024)
    case 'gb':
      return Math.floor(size * 1024 * 1024 * 1024)
    default:
      return Math.floor(size)
  }
}

/**
 * Read raw body from request
 */
async function readBody(req: IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let totalLength = 0

    req.on('data', (chunk: Buffer) => {
      totalLength += chunk.length

      if (totalLength > limit) {
        req.removeAllListeners('data')
        req.removeAllListeners('end')
        // Express.js 5.x: status 413, type 'entity.too.large'
        reject(new BodyParserError(
          `Request body size exceeds limit of ${limit} bytes`,
          413,
          'entity.too.large'
        ))
        return
      }

      chunks.push(chunk)
    })

    req.on('end', () => {
      resolve(Buffer.concat(chunks))
    })

    req.on('error', (err) => {
      reject(err)
    })
  })
}

/**
 * JSON Body Parser
 * Parses JSON request bodies
 */
export function json(options: BodyParserOptions = {}) {
  const limit = parseLimit(options.limit || '1mb')
  const strict = options.strict !== false

  return async (req: any, _res?: any, next?: any): Promise<void> => {
    try {
      // Check Content-Type
      const contentType = req.headers['content-type'] || ''
      if (!contentType.includes('application/json')) {
        if (next) next()
        return
      }

      // Skip if body already parsed
      if (req.body !== undefined) {
        if (next) next()
        return
      }

      const buffer = await readBody(req, limit)
      let text = buffer.toString('utf-8')

      // Empty body
      if (text.length === 0) {
        req.body = {}
        if (next) next()
        return
      }

      // Remove UTF-8 BOM if present (RFC 8259 Section 8.1)
      // UTF-8 BOM: 0xEF 0xBB 0xBF (U+FEFF)
      if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1)
      }

      // Parse JSON
      const parsed = JSON.parse(text)

      // Strict mode: only allow objects and arrays
      if (strict && typeof parsed !== 'object') {
        throw new Error('Strict mode: JSON body must be an object or array')
      }

      req.body = parsed
      if (next) next()
    } catch (err: any) {
      const error = err instanceof SyntaxError
        ? new Error(`Invalid JSON: ${err.message}`)
        : err

      if (next) {
        next(error)
      } else {
        throw error
      }
    }
  }
}

/**
 * Set nested property in object
 * Supports notation like 'user[profile][name]' = 'John'
 * Returns the depth of nesting
 */
function setNestedProperty(obj: any, path: string, value: any, maxDepth: number): number {
  // Parse nested keys: user[profile][name] -> ['user', 'profile', 'name']
  const keys: string[] = []
  let current = ''

  for (let i = 0; i < path.length; i++) {
    const char = path[i]
    if (char === '[') {
      if (current) {
        keys.push(current)
        current = ''
      }
    } else if (char === ']') {
      if (current) {
        keys.push(current)
        current = ''
      }
    } else {
      current += char
    }
  }

  if (current) {
    keys.push(current)
  }

  // Check depth limit (CVE-2024-45590)
  // Express.js 5.x: status 400, type 'parameters.depth.exceeded'
  const depth = keys.length
  if (depth > maxDepth) {
    throw new BodyParserError(
      `Request body depth exceeds limit of ${maxDepth}`,
      400,
      'parameters.depth.exceeded'
    )
  }

  // Set nested property
  let target = obj
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!target[key] || typeof target[key] !== 'object') {
      target[key] = {}
    }
    target = target[key]
  }

  const lastKey = keys[keys.length - 1]
  target[lastKey] = value

  return depth
}

/**
 * URL-encoded Body Parser
 * Parses application/x-www-form-urlencoded request bodies
 * Supports nested objects (Express.js 5.x compatible)
 */
export function urlencoded(options: BodyParserOptions = {}) {
  const limit = parseLimit(options.limit || '1mb')
  const maxDepth = options.depth ?? 32  // Default: 32 (Express.js 5.x)
  const maxParams = options.parameterLimit ?? 1000  // Default: 1000 (Express.js 5.x)

  return async (req: any, _res?: any, next?: any): Promise<void> => {
    try {
      // Check Content-Type
      const contentType = req.headers['content-type'] || ''
      if (!contentType.includes('application/x-www-form-urlencoded')) {
        if (next) next()
        return
      }

      // Skip if body already parsed
      if (req.body !== undefined) {
        if (next) next()
        return
      }

      const buffer = await readBody(req, limit)
      const text = buffer.toString('utf-8')

      // Empty body
      if (text.length === 0) {
        req.body = {}
        if (next) next()
        return
      }

      // Parse URL-encoded data
      const parsed: Record<string, any> = {}
      const pairs = text.split('&')

      // Check parameter limit
      // Express.js 5.x: status 413, type 'parameters.too.many'
      if (pairs.length > maxParams) {
        throw new BodyParserError(
          `Request parameters exceed limit of ${maxParams}`,
          413,
          'parameters.too.many'
        )
      }

      for (const pair of pairs) {
        const [key, value] = pair.split('=')
        // Replace + with space before decoding (application/x-www-form-urlencoded standard)
        const decodedKey = decodeURIComponent((key || '').replace(/\+/g, ' '))
        const decodedValue = decodeURIComponent((value || '').replace(/\+/g, ' '))

        if (decodedKey) {
          // Handle array notation: key[]=value
          if (decodedKey.endsWith('[]')) {
            const arrayKey = decodedKey.slice(0, -2)
            if (!parsed[arrayKey]) {
              parsed[arrayKey] = []
            }
            if (Array.isArray(parsed[arrayKey])) {
              parsed[arrayKey].push(decodedValue)
            }
          }
          // Handle nested objects: user[profile][name]=John
          else if (decodedKey.includes('[')) {
            setNestedProperty(parsed, decodedKey, decodedValue, maxDepth)
          }
          // Normal key-value
          else {
            parsed[decodedKey] = decodedValue
          }
        }
      }

      req.body = parsed
      if (next) next()
    } catch (err: any) {
      // Re-throw BodyParserError as-is to preserve status and type
      if (err instanceof BodyParserError) {
        if (next) {
          next(err)
        } else {
          throw err
        }
      } else {
        const error = new Error(`Failed to parse URL-encoded body: ${err.message}`)
        if (next) {
          next(error)
        } else {
          throw error
        }
      }
    }
  }
}

/**
 * Raw Body Parser
 * Parses raw binary data as Buffer
 */
export function raw(options: BodyParserOptions = {}) {
  const limit = parseLimit(options.limit || '1mb')

  return async (req: any, _res?: any, next?: any): Promise<void> => {
    try {
      // Check Content-Type (optional - can accept any type)
      const contentType = req.headers['content-type'] || ''

      // Only parse if Content-Type is application/octet-stream or similar
      // Or if explicitly set to parse all
      if (
        contentType &&
        !contentType.includes('application/octet-stream') &&
        !contentType.includes('application/') &&
        !contentType.includes('image/') &&
        !contentType.includes('video/') &&
        !contentType.includes('audio/')
      ) {
        if (next) next()
        return
      }

      // Skip if body already parsed
      if (req.body !== undefined) {
        if (next) next()
        return
      }

      const buffer = await readBody(req, limit)
      req.body = buffer
      if (next) next()
    } catch (err: any) {
      const error = new Error(`Failed to parse raw body: ${err.message}`)
      if (next) {
        next(error)
      } else {
        throw error
      }
    }
  }
}

/**
 * Text Body Parser
 * Parses text/plain request bodies as string
 */
export function text(options: BodyParserOptions = {}) {
  const limit = parseLimit(options.limit || '1mb')

  return async (req: any, _res?: any, next?: any): Promise<void> => {
    try {
      // Check Content-Type
      const contentType = req.headers['content-type'] || ''
      if (
        !contentType.includes('text/plain') &&
        !contentType.includes('text/')
      ) {
        if (next) next()
        return
      }

      // Skip if body already parsed
      if (req.body !== undefined) {
        if (next) next()
        return
      }

      // Extract charset from Content-Type (RFC 7231 Section 3.1.1.1)
      // Examples: "text/plain; charset=utf-8", "text/html; charset=iso-8859-1"
      const charsetMatch = /charset=([^;,\s]+)/i.exec(contentType)
      const charset = charsetMatch ? charsetMatch[1].trim().toLowerCase() : 'utf-8'

      // Map common charset names to Node.js encoding names
      const charsetMap: Record<string, BufferEncoding> = {
        'utf-8': 'utf8',
        'utf8': 'utf8',
        'iso-8859-1': 'latin1',
        'latin1': 'latin1',
        'us-ascii': 'ascii',
        'ascii': 'ascii',
      }

      // Get encoding, fallback to UTF-8 for unsupported charsets
      const encoding = charsetMap[charset] || 'utf8'

      const buffer = await readBody(req, limit)
      let text = buffer.toString(encoding)

      // Remove UTF-8 BOM if present (RFC 3629)
      // Only for UTF-8 encoded text
      if (encoding === 'utf8' && text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1)
      }

      req.body = text
      if (next) next()
    } catch (err: any) {
      const error = new Error(`Failed to parse text body: ${err.message}`)
      if (next) {
        next(error)
      } else {
        throw error
      }
    }
  }
}

/**
 * Auto Body Parser
 *
 * Automatically selects appropriate parser based on Content-Type header.
 * 10-15% faster than legacy approach (2 try-catch).
 *
 * @param options - Body parser options
 * @returns Body parser function
 *
 * @example
 * ```typescript
 * // Used in application.ts
 * await autoBodyParser(this.bodyParserOptions)(extendedReq)
 * ```
 */
export function autoBodyParser(options: BodyParserOptions = {}): (req: IncomingMessage) => Promise<void> {
  return async (req: IncomingMessage): Promise<void> => {
    // Check Content-Type header
    const contentType = req.headers['content-type']

    if (!contentType) {
      // Don't parse if no Content-Type
      return
    }

    // Extract only media type from Content-Type (remove charset, etc.)
    const mediaType = contentType.split(';')[0].trim().toLowerCase()

    // Select appropriate parser based on Content-Type
    if (mediaType === 'application/json') {
      // JSON parser
      await json(options)(req)
    } else if (mediaType === 'application/x-www-form-urlencoded') {
      // URL-encoded parser
      await urlencoded(options)(req)
    } else if (mediaType.startsWith('text/')) {
      // Text parser
      await text(options)(req)
    } else if (
      mediaType === 'application/octet-stream' ||
      mediaType.startsWith('multipart/') ||
      mediaType.startsWith('image/') ||
      mediaType.startsWith('video/') ||
      mediaType.startsWith('audio/')
    ) {
      // Raw parser (binary data)
      await raw(options)(req)
    }
    // Ignore other Content-Types (don't parse)
  }
}

/**
 * Body Parser Error
 * Express.js 5.x compatible error format
 */
export class BodyParserError extends Error {
  status: number
  statusCode: number // Alias for compatibility
  type: string

  constructor(message: string, status: number = 400, type: string = 'entity.parse.failed') {
    super(message)
    this.name = 'BodyParserError'
    this.status = status
    this.statusCode = status // Alias for backward compatibility
    this.type = type
  }
}
