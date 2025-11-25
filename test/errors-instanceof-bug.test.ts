/**
 * Error instanceof Bug Test
 *
 * This test demonstrates the bug where FeatureExecutionError
 * fails to preserve statusCode when the error is not recognized
 * as HttpError due to module instance mismatch.
 *
 * Bug scenario:
 * - When using `file:../../` or different module instances
 * - `instanceof HttpError` returns false even for valid HttpError-like objects
 * - Result: All custom errors get statusCode 500 instead of their actual status
 */

import { describe, it, expect } from '@jest/globals'
import { FeatureExecutionError, isHttpError } from '../src/errors/index.js'

describe('Error instanceof Bug - FeatureExecutionError', () => {
  /**
   * This test simulates module instance mismatch scenario
   * where an error has statusCode but is not recognized as HttpError
   */
  it('should preserve statusCode from error with statusCode property (module mismatch scenario)', () => {
    // Simulate an error from different module instance
    // This error has statusCode but is not `instanceof HttpError`
    class ExternalValidationError extends Error {
      public readonly statusCode: number = 400
      public readonly isOperational: boolean = true

      constructor(message: string) {
        super(message)
        this.name = 'ValidationError'
      }
    }

    const externalError = new ExternalValidationError('Email already taken')

    // Current bug: instanceof HttpError returns false
    // so statusCode becomes 500 instead of 400
    const wrappedError = new FeatureExecutionError(externalError)

    // This should pass but currently FAILS due to instanceof check
    expect(wrappedError.statusCode).toBe(400)
    expect(wrappedError.message).toBe('Email already taken')
    expect(wrappedError.originalError).toBe(externalError)
  })

  it('should preserve statusCode 401 for unauthorized errors from external modules', () => {
    class ExternalUnauthorizedError extends Error {
      public readonly statusCode: number = 401

      constructor(message: string) {
        super(message)
        this.name = 'UnauthorizedError'
      }
    }

    const externalError = new ExternalUnauthorizedError('Invalid token')
    const wrappedError = new FeatureExecutionError(externalError)

    expect(wrappedError.statusCode).toBe(401)
  })

  it('should preserve statusCode 403 for forbidden errors from external modules', () => {
    class ExternalForbiddenError extends Error {
      public readonly statusCode: number = 403

      constructor(message: string) {
        super(message)
        this.name = 'ForbiddenError'
      }
    }

    const externalError = new ExternalForbiddenError('Access denied')
    const wrappedError = new FeatureExecutionError(externalError)

    expect(wrappedError.statusCode).toBe(403)
  })

  it('should preserve statusCode 404 for not found errors from external modules', () => {
    class ExternalNotFoundError extends Error {
      public readonly statusCode: number = 404

      constructor(message: string) {
        super(message)
        this.name = 'NotFoundError'
      }
    }

    const externalError = new ExternalNotFoundError('User not found')
    const wrappedError = new FeatureExecutionError(externalError)

    expect(wrappedError.statusCode).toBe(404)
  })

  it('should preserve statusCode 422 for validation errors', () => {
    // Some frameworks use 422 for validation errors
    class ExternalValidationError extends Error {
      public readonly statusCode: number = 422

      constructor(message: string) {
        super(message)
        this.name = 'ValidationError'
      }
    }

    const externalError = new ExternalValidationError('Invalid input')
    const wrappedError = new FeatureExecutionError(externalError)

    expect(wrappedError.statusCode).toBe(422)
  })

  it('should default to 500 when error has no statusCode', () => {
    const plainError = new Error('Something went wrong')
    const wrappedError = new FeatureExecutionError(plainError)

    expect(wrappedError.statusCode).toBe(500)
  })
})

describe('Error instanceof Bug - isHttpError', () => {
  /**
   * isHttpError should work with duck typing, not just instanceof
   */
  it('should recognize error with statusCode and isOperational as HttpError-like', () => {
    class ExternalHttpError extends Error {
      public readonly statusCode: number = 400
      public readonly isOperational: boolean = true

      constructor(message: string) {
        super(message)
        this.name = 'HttpError'
      }
    }

    const externalError = new ExternalHttpError('Bad request')

    // Current behavior: returns false because instanceof fails
    // Expected behavior: should return true (duck typing)
    expect(isHttpError(externalError)).toBe(true)
  })

  it('should return false for errors without statusCode', () => {
    const plainError = new Error('Plain error')
    expect(isHttpError(plainError)).toBe(false)
  })

  it('should return false for non-error objects', () => {
    expect(isHttpError(null)).toBe(false)
    expect(isHttpError(undefined)).toBe(false)
    expect(isHttpError('string')).toBe(false)
    expect(isHttpError({})).toBe(false)
  })

  it('should return false for objects with statusCode but not Error instance', () => {
    const fakeError = { statusCode: 400, message: 'Fake error' }
    expect(isHttpError(fakeError)).toBe(false)
  })
})
