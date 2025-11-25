/**
 * Auto-Error Handler Duck Typing Tests
 *
 * TDD: Tests for duck typing support in error handling
 *
 * This ensures errors from different module instances (ESM/CJS)
 * are correctly identified and handled.
 */

import { AutoErrorHandler } from '../src/feature/auto-error-handler.js'
import { FeatureError, ValidationError } from '../src/feature/types.js'
import { ServerResponse } from 'http'

describe('Auto-Error Handler - Duck Typing', () => {
  // Mock ServerResponse
  function createMockResponse(): ServerResponse {
    const chunks: Buffer[] = []
    const res = {
      statusCode: 200,
      headers: {} as Record<string, string>,
      setHeader: function(name: string, value: string) {
        this.headers[name] = value
        return this
      },
      end: function(data?: string | Buffer) {
        if (data) {
          chunks.push(Buffer.from(data))
        }
        return this
      },
      getBody: function() {
        return Buffer.concat(chunks).toString()
      },
    }
    return res as unknown as ServerResponse
  }

  describe('isFeatureError (duck typing)', () => {
    it('should handle actual FeatureError instance', () => {
      const error = new FeatureError('Test error', undefined, undefined, undefined, 400)
      const res = createMockResponse()

      AutoErrorHandler.handle(error, res)

      expect(res.statusCode).toBe(400)
      const body = JSON.parse((res as any).getBody())
      expect(body.error).toBe('FeatureError')
      expect(body.message).toBe('Test error')
    })

    it('should handle duck-typed FeatureError (from different module instance)', () => {
      // Simulate error created in a different module (not using instanceof)
      const duckTypedError = new Error('Duck typed error') as any
      duckTypedError.name = 'FeatureError'
      duckTypedError.statusCode = 422

      const res = createMockResponse()
      AutoErrorHandler.handle(duckTypedError, res)

      // Should be recognized as FeatureError via duck typing
      expect(res.statusCode).toBe(422)
      const body = JSON.parse((res as any).getBody())
      expect(body.error).toBe('FeatureError')
      expect(body.message).toBe('Duck typed error')
    })

    it('should handle FeatureError with step info via duck typing', () => {
      const duckTypedError = new Error('Step error') as any
      duckTypedError.name = 'FeatureError'
      duckTypedError.statusCode = 500
      duckTypedError.step = { number: 100, name: '100-validate.js' }

      const res = createMockResponse()
      AutoErrorHandler.handle(duckTypedError, res)

      expect(res.statusCode).toBe(500)
      const body = JSON.parse((res as any).getBody())
      expect(body.details?.step?.number).toBe(100)
      expect(body.details?.step?.name).toBe('100-validate.js')
    })
  })

  describe('isValidationError (duck typing)', () => {
    it('should handle actual ValidationError instance', () => {
      const error = new ValidationError('Validation failed')
      const res = createMockResponse()

      AutoErrorHandler.handle(error, res)

      expect(res.statusCode).toBe(400)
      const body = JSON.parse((res as any).getBody())
      expect(body.error).toBe('ValidationError')
      expect(body.message).toBe('Validation failed')
    })

    it('should handle duck-typed ValidationError (from different module instance)', () => {
      const duckTypedError = new Error('Invalid input') as any
      duckTypedError.name = 'ValidationError'
      duckTypedError.statusCode = 400

      const res = createMockResponse()
      AutoErrorHandler.handle(duckTypedError, res)

      // Should be recognized as ValidationError via duck typing
      expect(res.statusCode).toBe(400)
      const body = JSON.parse((res as any).getBody())
      expect(body.error).toBe('ValidationError')
      expect(body.message).toBe('Invalid input')
    })

    it('should handle ValidationError with custom status code', () => {
      const duckTypedError = new Error('Custom validation error') as any
      duckTypedError.name = 'ValidationError'
      duckTypedError.statusCode = 422  // Unprocessable Entity

      const res = createMockResponse()
      AutoErrorHandler.handle(duckTypedError, res)

      expect(res.statusCode).toBe(422)
    })
  })

  describe('Generic errors with statusCode (duck typing)', () => {
    it('should handle any error with statusCode property', () => {
      const customError = new Error('Custom error') as any
      customError.statusCode = 403

      const res = createMockResponse()
      AutoErrorHandler.handle(customError, res)

      expect(res.statusCode).toBe(403)
      const body = JSON.parse((res as any).getBody())
      expect(body.message).toBe('Custom error')
    })

    it('should fallback to 500 for errors without statusCode', () => {
      const plainError = new Error('Plain error')

      const res = createMockResponse()
      AutoErrorHandler.handle(plainError, res)

      expect(res.statusCode).toBe(500)
    })
  })

  describe('Error name consistency', () => {
    it('should use error.name for response', () => {
      const error = new Error('Test') as any
      error.name = 'CustomError'
      error.statusCode = 400

      const res = createMockResponse()
      AutoErrorHandler.handle(error, res)

      const body = JSON.parse((res as any).getBody())
      expect(body.error).toBe('CustomError')
    })
  })
})
