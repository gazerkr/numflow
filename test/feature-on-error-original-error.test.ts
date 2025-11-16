/**
 * Feature onError - originalError Access Integration Test
 *
 * Tests that onError handler can access originalError properties
 * for retry logic and custom error handling
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'

// Use built dist/cjs to avoid dual package hazard
const numflow = require('../dist/cjs/index.js').default

describe('Feature onError - originalError access integration', () => {
  let tempDir: string
  let app: any

  beforeEach(async () => {
    // Create temp directory
    tempDir = path.join(os.tmpdir(), `numflow-test-${Date.now()}`)
    fs.mkdirSync(tempDir, { recursive: true })

    app = numflow()
  })

  afterEach(() => {
    // Cleanup
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('should access originalError.code in onError handler', async () => {
    const featureDir = path.join(tempDir, 'features', 'api', 'orders', '@post')
    fs.mkdirSync(featureDir, { recursive: true })

    // Step that throws BusinessError
    const stepsDir = path.join(featureDir, 'steps')
    fs.mkdirSync(stepsDir, { recursive: true })

    fs.writeFileSync(
      path.join(stepsDir, '100-check-stock.js'),
      `
      const { BusinessError } = require('${path.resolve('./dist/cjs/index.js')}');
      module.exports = async (ctx, req, res) => {
        throw new BusinessError('Out of stock', 'OUT_OF_STOCK');
      };
      `
    )

    // Feature with onError that accesses originalError
    fs.writeFileSync(
      path.join(featureDir, 'index.js'),
      `
      const numflow = require('${path.resolve('./dist/cjs/index.js')}').default;

      module.exports = numflow.feature({
        onError: async (error, ctx, req, res) => {
          // Access originalError
          if (error.originalError && error.originalError.code === 'OUT_OF_STOCK') {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              errorCode: error.originalError.code,  // Use code property
              message: 'Stock not available',
              originalMessage: error.originalError.message
            }));
            return;
          }
        }
      });
      `
    )

    // Register features
    await app.registerFeatures(path.join(tempDir, 'features'))

    // Send request
    const response = await app.inject({
      method: 'POST',
      url: '/api/orders',
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(false)
    expect(body.errorCode).toBe('OUT_OF_STOCK') // Successfully accessed code property
    expect(body.message).toBe('Stock not available')
  })

  it('should access ValidationError.validationErrors in onError', async () => {
    const featureDir = path.join(tempDir, 'features', 'api', 'users', '@post')
    fs.mkdirSync(featureDir, { recursive: true })

    const stepsDir = path.join(featureDir, 'steps')
    fs.mkdirSync(stepsDir, { recursive: true })

    fs.writeFileSync(
      path.join(stepsDir, '100-validate.js'),
      `
      const { ValidationError } = require('${path.resolve('./dist/cjs/index.js')}');
      module.exports = async (ctx, req, res) => {
        const errors = {
          email: ['Email is required', 'Invalid format'],
          password: ['Too short']
        };
        throw new ValidationError('Validation failed', errors);
      };
      `
    )

    fs.writeFileSync(
      path.join(featureDir, 'index.js'),
      `
      const numflow = require('${path.resolve('./dist/cjs/index.js')}').default;

      module.exports = numflow.feature({
        onError: async (error, ctx, req, res) => {
          // Access originalError.validationErrors
          if (error.originalError && error.originalError.validationErrors) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              errors: error.originalError.validationErrors  // Use validationErrors property
            }));
            return;
          }
        }
      });
      `
    )

    await app.registerFeatures(path.join(tempDir, 'features'))

    const response = await app.inject({
      method: 'POST',
      url: '/api/users',
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.errors.email).toEqual(['Email is required', 'Invalid format'])
    expect(body.errors.password).toEqual(['Too short'])
  })

  it('should use originalError.code for retry logic', async () => {
    const featureDir = path.join(tempDir, 'features', 'api', 'payments', '@post')
    fs.mkdirSync(featureDir, { recursive: true })

    const stepsDir = path.join(featureDir, 'steps')
    fs.mkdirSync(stepsDir, { recursive: true })

    fs.writeFileSync(
      path.join(stepsDir, '100-process-payment.js'),
      `
      const { BusinessError } = require('${path.resolve('./dist/cjs/index.js')}');
      let attemptCount = 0;

      module.exports = async (ctx, req, res) => {
        attemptCount++;

        if (attemptCount === 1) {
          // First attempt: Network error occurs
          throw new BusinessError('Network timeout', 'NETWORK_ERROR');
        }

        // Second attempt: Success
        res.status(200).json({ success: true, attempts: attemptCount });
      };
      `
    )

    fs.writeFileSync(
      path.join(featureDir, 'index.js'),
      `
      const numflow = require('${path.resolve('./dist/cjs/index.js')}').default;

      module.exports = numflow.feature({
        onError: async (error, ctx, req, res) => {
          // Determine retry based on originalError.code
          if (error.originalError && error.originalError.code === 'NETWORK_ERROR') {
            ctx.fallbackProvider = 'backup';
            return numflow.retry({ delay: 10, maxAttempts: 2 });
          }

          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: error.message }));
        }
      });
      `
    )

    await app.registerFeatures(path.join(tempDir, 'features'))

    const response = await app.inject({
      method: 'POST',
      url: '/api/payments',
    })

    // Success after retry
    expect(response.statusCode).toBe(200)
    const body = JSON.parse(response.body)
    expect(body.success).toBe(true)
    expect(body.attempts).toBe(2) // Success on second attempt
  })

  it('should access custom error properties in onError', async () => {
    const featureDir = path.join(tempDir, 'features', 'api', 'orders', '@get')
    fs.mkdirSync(featureDir, { recursive: true })

    const stepsDir = path.join(featureDir, 'steps')
    fs.mkdirSync(stepsDir, { recursive: true })

    fs.writeFileSync(
      path.join(stepsDir, '100-fetch.js'),
      `
      const { HttpError } = require('${path.resolve('./dist/cjs/index.js')}');

      class PaymentError extends HttpError {
        constructor(message, transactionId, provider) {
          super(message, 400);
          this.transactionId = transactionId;
          this.provider = provider;
          this.retryable = true;
        }
      }

      module.exports = async (ctx, req, res) => {
        throw new PaymentError('Payment failed', 'tx_123', 'stripe');
      };
      `
    )

    fs.writeFileSync(
      path.join(featureDir, 'index.js'),
      `
      const numflow = require('${path.resolve('./dist/cjs/index.js')}').default;

      module.exports = numflow.feature({
        onError: async (error, ctx, req, res) => {
          // Access custom error properties
          if (error.originalError && error.originalError.transactionId) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: false,
              transactionId: error.originalError.transactionId,  // Custom property
              provider: error.originalError.provider,
              retryable: error.originalError.retryable
            }));
            return;
          }
        }
      });
      `
    )

    await app.registerFeatures(path.join(tempDir, 'features'))

    const response = await app.inject({
      method: 'GET',
      url: '/api/orders',
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.transactionId).toBe('tx_123')
    expect(body.provider).toBe('stripe')
    expect(body.retryable).toBe(true)
  })
})
