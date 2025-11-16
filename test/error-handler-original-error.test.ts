/**
 * Error Handler - originalError Extraction Test
 *
 * Tests that Global Error Handler extracts custom properties
 * from FeatureError.originalError automatically
 */

import { describe, it, expect, beforeEach } from '@jest/globals'
import { IncomingMessage, ServerResponse } from 'http'
import { sendErrorResponse } from '../src/errors/error-handler.js'
import { FeatureError } from '../src/feature/types.js'
import { BusinessError, ValidationError, HttpError } from '../src/errors/index.js'

describe('Error Handler - originalError extraction', () => {
  let mockReq: IncomingMessage
  let mockRes: ServerResponse
  let responseBody: any

  beforeEach(() => {
    mockReq = {} as IncomingMessage

    responseBody = null
    mockRes = {
      headersSent: false,
      statusCode: 0,
      setHeader: jest.fn(),
      end: jest.fn((data) => {
        responseBody = JSON.parse(data)
      }),
    } as any
  })

  describe('BusinessError code extraction via originalError', () => {
    it('should extract code from BusinessError via originalError', () => {
      const originalError = new BusinessError('Out of stock', 'OUT_OF_STOCK')
      const featureError = new FeatureError(
        originalError.message,
        originalError,
        {
          number: 200,
          name: '200-check-stock.js',
          path: '/test',
          fn: async () => {},
        },
        {},
        400
      )

      sendErrorResponse(featureError, mockReq, mockRes, false)

      expect(mockRes.statusCode).toBe(400)
      expect(responseBody.error.message).toBe('Out of stock')
      expect(responseBody.error.code).toBe('OUT_OF_STOCK') // code extracted successfully
    })

    it('should extract suggestion and docUrl from BusinessError via originalError', () => {
      const originalError = new BusinessError('Operation failed', 'BUSINESS_ERROR')
      const featureError = new FeatureError(
        originalError.message,
        originalError,
        {
          number: 100,
          name: '100-test.js',
          path: '/test',
          fn: async () => {},
        },
        {},
        400
      )

      sendErrorResponse(featureError, mockReq, mockRes, false)

      expect(responseBody.error.suggestion).toBeDefined()
      expect(responseBody.error.docUrl).toBeDefined()
    })
  })

  describe('ValidationError validationErrors extraction via originalError', () => {
    it('should extract validationErrors from ValidationError via originalError', () => {
      const validationErrors = {
        email: ['Email is required', 'Invalid format'],
        password: ['Too short'],
      }
      const originalError = new ValidationError('Validation failed', validationErrors)
      const featureError = new FeatureError(
        originalError.message,
        originalError,
        {
          number: 100,
          name: '100-validate.js',
          path: '/test',
          fn: async () => {},
        },
        {},
        400
      )

      sendErrorResponse(featureError, mockReq, mockRes, false)

      expect(mockRes.statusCode).toBe(400)
      expect(responseBody.error.validationErrors).toEqual(validationErrors) // validationErrors extracted successfully
    })
  })

  describe('Custom error properties extraction via originalError', () => {
    it('should extract all custom properties from custom error via originalError', () => {
      // Custom user-defined error
      class PaymentError extends HttpError {
        public readonly transactionId: string
        public readonly provider: string
        public readonly retryable: boolean

        constructor(
          message: string,
          transactionId: string,
          provider: string,
          retryable: boolean
        ) {
          super(message, 400)
          this.transactionId = transactionId
          this.provider = provider
          this.retryable = retryable
        }
      }

      const originalError = new PaymentError('Payment failed', 'tx_123', 'stripe', true)
      const featureError = new FeatureError(
        originalError.message,
        originalError,
        {
          number: 300,
          name: '300-payment.js',
          path: '/test',
          fn: async () => {},
        },
        {},
        400
      )

      sendErrorResponse(featureError, mockReq, mockRes, false)

      // All custom properties automatically extracted
      expect(responseBody.error.transactionId).toBe('tx_123')
      expect(responseBody.error.provider).toBe('stripe')
      expect(responseBody.error.retryable).toBe(true)
    })
  })

  describe('FeatureError without originalError (backward compatibility)', () => {
    it('should work without originalError', () => {
      const featureError = new FeatureError(
        'Error message',
        undefined,
        {
          number: 100,
          name: '100-test.js',
          path: '/test',
          fn: async () => {},
        },
        {},
        500
      )

      sendErrorResponse(featureError, mockReq, mockRes, false)

      expect(mockRes.statusCode).toBe(500)
      expect(responseBody.error.message).toBe('Error message')
      expect(responseBody.error.step).toBeDefined()
    })
  })

  describe('Step information preservation', () => {
    it('should include step information along with originalError properties', () => {
      const originalError = new BusinessError('Test error', 'TEST_CODE')
      const featureError = new FeatureError(
        originalError.message,
        originalError,
        {
          number: 200,
          name: '200-test.js',
          path: '/test/path',
          fn: async () => {},
        },
        {},
        400
      )

      sendErrorResponse(featureError, mockReq, mockRes, false)

      // Both step and originalError properties are included
      expect(responseBody.error.step).toEqual({
        number: 200,
        name: '200-test.js',
      })
      expect(responseBody.error.code).toBe('TEST_CODE')
    })
  })

  describe('Multiple custom properties', () => {
    it('should extract multiple custom properties automatically', () => {
      class OrderError extends HttpError {
        public readonly orderId: string
        public readonly customerId: string
        public readonly amount: number
        public readonly currency: string

        constructor(message: string, orderId: string, customerId: string, amount: number) {
          super(message, 400)
          this.orderId = orderId
          this.customerId = customerId
          this.amount = amount
          this.currency = 'USD'
        }
      }

      const originalError = new OrderError(
        'Order processing failed',
        'order_123',
        'customer_456',
        99.99
      )
      const featureError = new FeatureError(
        originalError.message,
        originalError,
        { number: 100, name: '100-test.js', path: '/test', fn: async () => {} },
        {},
        400
      )

      sendErrorResponse(featureError, mockReq, mockRes, false)

      // All custom properties automatically extracted
      expect(responseBody.error.orderId).toBe('order_123')
      expect(responseBody.error.customerId).toBe('customer_456')
      expect(responseBody.error.amount).toBe(99.99)
      expect(responseBody.error.currency).toBe('USD')
    })
  })

  describe('Standard Error properties exclusion', () => {
    it('should not include standard Error properties (message, stack, name)', () => {
      const originalError = new BusinessError('Test error', 'TEST_CODE')
      const featureError = new FeatureError(
        originalError.message,
        originalError,
        { number: 100, name: '100-test.js', path: '/test', fn: async () => {} },
        {},
        400
      )

      sendErrorResponse(featureError, mockReq, mockRes, false)

      // message goes to error.message and should not be duplicated
      expect(responseBody.error.message).toBe('Test error')

      // name and stack should not be included in response (includeStack=false)
      expect(responseBody.error.name).toBeUndefined()
    })
  })
})
