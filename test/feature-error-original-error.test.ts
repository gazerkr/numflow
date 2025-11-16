/**
 * FeatureError originalError Preservation Test
 *
 * Tests that FeatureError preserves the original error object
 * so that custom properties (code, validationErrors, etc.) are not lost
 */

import { describe, it, expect } from '@jest/globals'
import { FeatureError } from '../src/feature/types.js'
import { BusinessError, ValidationError, HttpError } from '../src/errors/index.js'

describe('FeatureError - originalError preservation', () => {
  it('should preserve originalError reference', () => {
    const originalError = new BusinessError('재고 부족', 'OUT_OF_STOCK')
    const step = {
      number: 200,
      name: '200-check-stock.js',
      path: '/features/orders/post/steps/200-check-stock.js',
      fn: async () => {},
    }
    const context = { productId: 'prod_123' }

    const featureError = new FeatureError(
      originalError.message,
      originalError, // Pass originalError
      step,
      context,
      400
    )

    expect(featureError.originalError).toBe(originalError)
    expect(featureError.originalError).toBeInstanceOf(BusinessError)
  })

  it('should preserve BusinessError code property via originalError', () => {
    const originalError = new BusinessError('재고 부족', 'OUT_OF_STOCK')
    const step = {
      number: 200,
      name: '200-check-stock.js',
      path: '/test/path',
      fn: async () => {},
    }

    const featureError = new FeatureError(
      originalError.message,
      originalError,
      step,
      {},
      400
    )

    // Can access code through originalError
    expect(featureError.originalError).toBeDefined()
    expect((featureError.originalError as BusinessError).code).toBe('OUT_OF_STOCK')
  })

  it('should preserve ValidationError validationErrors property via originalError', () => {
    const validationErrors = {
      email: ['Email is required', 'Invalid format'],
      password: ['Password is too short'],
    }
    const originalError = new ValidationError('Validation failed', validationErrors)
    const step = {
      number: 100,
      name: '100-validate.js',
      path: '/test/path',
      fn: async () => {},
    }

    const featureError = new FeatureError(
      originalError.message,
      originalError,
      step,
      {},
      400
    )

    // Can access validationErrors through originalError
    expect(featureError.originalError).toBeDefined()
    expect((featureError.originalError as ValidationError).validationErrors).toEqual(
      validationErrors
    )
  })

  it('should preserve custom error properties via originalError', () => {
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
    const step = {
      number: 300,
      name: '300-payment.js',
      path: '/test/path',
      fn: async () => {},
    }

    const featureError = new FeatureError(
      originalError.message,
      originalError,
      step,
      {},
      400
    )

    // Can access all custom properties through originalError
    const paymentError = featureError.originalError as PaymentError
    expect(paymentError.transactionId).toBe('tx_123')
    expect(paymentError.provider).toBe('stripe')
    expect(paymentError.retryable).toBe(true)
  })

  it('should preserve HttpError suggestion and docUrl via originalError', () => {
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

    // HttpError suggestion and docUrl are also preserved
    expect((featureError.originalError as HttpError).suggestion).toBeDefined()
    expect((featureError.originalError as HttpError).docUrl).toBeDefined()
  })

  it('should work without originalError (backward compatibility)', () => {
    const step = {
      number: 100,
      name: '100-test.js',
      path: '/test',
      fn: async () => {},
    }

    // Create without originalError (backward compatibility)
    const featureError = new FeatureError('Error message', undefined, step, {}, 500)

    expect(featureError.message).toBe('Error message')
    expect(featureError.statusCode).toBe(500)
    expect(featureError.originalError).toBeUndefined()
  })

  it('should preserve step and context along with originalError', () => {
    const originalError = new BusinessError('Test error', 'TEST_CODE')
    const step = {
      number: 200,
      name: '200-test.js',
      path: '/test/path',
      fn: async () => {},
    }
    const context = { userId: 'user_123', data: { test: true } }

    const featureError = new FeatureError(
      originalError.message,
      originalError,
      step,
      context,
      400
    )

    // step, context, and originalError are all preserved
    expect(featureError.step).toEqual(step)
    expect(featureError.context).toEqual(context)
    expect(featureError.originalError).toBe(originalError)
    expect((featureError.originalError as BusinessError).code).toBe('TEST_CODE')
  })
})
