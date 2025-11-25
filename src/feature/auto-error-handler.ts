/**
 * Auto-Error Handler
 *
 * Automatically handles errors that occur during Feature execution.
 *
 * Key features:
 * 1. Error catching: Catches all errors that occur during Step execution
 * 2. HTTP response: Converts errors to appropriate HTTP responses
 * 3. Error logging: Logs error information
 *
 * Uses duck typing for consistent error handling across different module instances
 * (ESM/CommonJS compatibility).
 */

import { ServerResponse } from 'http'
import { FeatureError, FeatureValidationError } from './types.js'
import { hasStatusCode } from '../utils/type-guards.js'

/**
 * Type for duck-typed FeatureError
 * Used for cross-module compatibility (ESM/CJS)
 */
interface DuckTypedFeatureError extends Error {
  statusCode: number
  step?: { number: number; name: string }
}

/**
 * Check if error is FeatureError (or duck-typed FeatureError)
 *
 * Supports errors from different module instances (ESM/CJS).
 * Note: Excludes ValidationError (which extends FeatureError but has different name)
 */
function isFeatureError(error: Error): error is DuckTypedFeatureError {
  // Check actual FeatureError instance (but not ValidationError subclass)
  if (error instanceof FeatureError && error.name === 'FeatureError') {
    return true
  }
  // Duck typing fallback for cross-module compatibility
  return error.name === 'FeatureError' && hasStatusCode(error)
}

/**
 * Type for duck-typed ValidationError
 * Used for cross-module compatibility (ESM/CJS)
 */
interface DuckTypedValidationError extends Error {
  statusCode: number
}

/**
 * Check if error is ValidationError (or duck-typed ValidationError)
 *
 * Supports errors from different module instances (ESM/CJS).
 */
function isValidationError(error: Error): error is DuckTypedValidationError {
  if (error instanceof FeatureValidationError) {
    return true
  }
  // Duck typing fallback for cross-module compatibility
  return error.name === 'ValidationError' && hasStatusCode(error)
}

/**
 * Auto-Error Handler class
 */
export class AutoErrorHandler {
  /**
   * Handle error and send HTTP response
   *
   * @param error - Error that occurred
   * @param res - HTTP Response object
   */
  static handle(error: Error, res: ServerResponse): void {
    // 1. Log error
    this.logError(error)

    // 2. Send HTTP response
    this.sendErrorResponse(error, res)
  }

  /**
   * Send HTTP error response
   *
   * Uses duck typing (hasStatusCode) to support errors from different module instances.
   *
   * @param error - Error that occurred
   * @param res - HTTP Response object
   */
  private static sendErrorResponse(error: Error, res: ServerResponse): void {
    let statusCode = 500
    let errorName = 'InternalServerError'
    let errorMessage = 'An unexpected error occurred'
    let details: any = {}

    // Handle FeatureError (including duck-typed errors from different module instances)
    if (isFeatureError(error)) {
      statusCode = error.statusCode
      errorName = error.name
      errorMessage = error.message

      if (error.step) {
        details.step = {
          number: error.step.number,
          name: error.step.name,
        }
      }
    }
    // Handle ValidationError (including duck-typed errors from different module instances)
    else if (isValidationError(error)) {
      statusCode = error.statusCode
      errorName = error.name
      errorMessage = error.message
    }
    // Handle any error with statusCode (duck typing for HttpError and external errors)
    else if (hasStatusCode(error)) {
      statusCode = error.statusCode
      errorName = error.name || 'Error'
      errorMessage = error.message || 'An unexpected error occurred'
    }
    // Handle generic Error
    else {
      statusCode = 500
      errorName = 'Error'
      errorMessage = error.message || 'An unexpected error occurred'
    }

    // Send JSON response
    res.statusCode = statusCode
    res.setHeader('Content-Type', 'application/json')
    res.end(
      JSON.stringify({
        success: false,
        error: errorName,
        message: errorMessage,
        details: Object.keys(details).length > 0 ? details : undefined,
        // Include stack trace only in development environment
        ...(process.env.NODE_ENV === 'development' && {
          stack: error.stack,
        }),
      })
    )
  }

  /**
   * Log error
   *
   * @param error - Error that occurred
   */
  private static logError(error: Error): void {
    if (process.env.DISABLE_FEATURE_LOGS === 'true' || process.env.NODE_ENV === 'test') {
      return
    }
    console.error('[AutoErrorHandler] Error occurred:')
    console.error(`  Name: ${error.name}`)
    console.error(`  Message: ${error.message}`)

    if (isFeatureError(error) && error.step) {
      console.error(`  Step: ${error.step.number} (${error.step.name})`)
    }

    if (error.stack) {
      console.error(`  Stack: ${error.stack}`)
    }
  }
}
