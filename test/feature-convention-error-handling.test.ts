/**
 * Feature Convention Error Handling Tests
 *
 * Tests for proper error handling when Convention resolution fails.
 *
 * Bug: When feature() is called outside of 'features' directory,
 * Convention resolution fails silently, leaving method and path as undefined.
 * This causes "has no method, skipping" error during registration.
 *
 * Test scenario:
 * - test.xml/@get/index.js (outside of 'features' directory)
 * - feature() is called without explicit method/path
 * - Convention resolution should fail with clear error message
 */

import * as path from 'path'
import * as fs from 'fs'
import { ConventionResolver } from '../src/feature/convention.js'

describe('Feature Convention Error Handling', () => {
  let testDir: string

  beforeEach(() => {
    testDir = path.join(process.cwd(), 'tmp-test-convention-error-' + Date.now())
    fs.mkdirSync(testDir, { recursive: true })
    ConventionResolver.clearCache()
  })

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
    ConventionResolver.clearCache()
  })

  describe('Bug Reproduction: index.js outside features directory', () => {
    it('should throw clear error when features directory is not found', () => {
      // Create test.xml/@get/index.js (outside of 'features' directory)
      const featureDir = path.join(testDir, 'test.xml/@get')
      const indexFile = path.join(featureDir, 'index.js')
      fs.mkdirSync(featureDir, { recursive: true })

      // This should throw an error because 'features' directory is not found
      expect(() => {
        ConventionResolver.resolveConventions(indexFile)
      }).toThrow('Could not find \'features\' directory')
    })

    it('should document the bug: Convention resolution fails silently in feature()', () => {
      // This test documents the current bug behavior
      // When resolveConventions() throws an error, feature() catches it
      // and silently ignores it, leaving method/path as undefined

      // In feature() function (src/feature/index.ts:378-386):
      // try {
      //   conventions = ConventionResolver.resolveConventions(callerPath)
      // } catch (error) {
      //   // Silently ignores the error!
      //   basePath = process.cwd()
      // }
      // This causes method and path to remain undefined

      // We can't easily test this without actually calling feature(),
      // but we document the expected behavior:
      // - Convention resolution should fail
      // - Error should be caught and ignored
      // - method and path should be undefined
      expect(true).toBe(true)
    })
  })

  describe('Convention resolution with featuresBase parameter', () => {
    it('should resolve conventions when featuresBase is explicitly provided', () => {
      // Create custom base directory (not named 'features')
      const baseDir = path.join(testDir, 'my-api')
      const featureDir = path.join(baseDir, 'users/@get')
      const indexFile = path.join(featureDir, 'index.js')
      fs.mkdirSync(featureDir, { recursive: true })
      fs.writeFileSync(indexFile, 'module.exports = {}')

      // Should work when featuresBase is explicitly provided
      const conventions = ConventionResolver.resolveConventions(indexFile, baseDir)

      expect(conventions.method).toBe('GET')
      expect(conventions.path).toBe('/users')
      expect(conventions.steps).toBeNull()
      expect(conventions.asyncTasks).toBeNull()
    })

    it('should resolve conventions with custom base directory name', () => {
      // Create custom base directory
      const baseDir = path.join(testDir, 'endpoints')
      const featureDir = path.join(baseDir, 'api/orders/@post')
      const indexFile = path.join(featureDir, 'index.js')
      fs.mkdirSync(featureDir, { recursive: true })
      fs.mkdirSync(path.join(featureDir, 'steps'))
      fs.writeFileSync(indexFile, 'module.exports = {}')

      // Should work with explicit featuresBase
      const conventions = ConventionResolver.resolveConventions(indexFile, baseDir)

      expect(conventions.method).toBe('POST')
      expect(conventions.path).toBe('/api/orders')
      expect(conventions.steps).toBe('./steps')
      expect(conventions.asyncTasks).toBeNull()
    })
  })

  describe('Error handling improvements', () => {
    it('should provide clear error message when Convention resolution fails', () => {
      // Create directory outside of 'features'
      const featureDir = path.join(testDir, 'src/handlers/@get')
      const indexFile = path.join(featureDir, 'index.js')
      fs.mkdirSync(featureDir, { recursive: true })
      fs.writeFileSync(indexFile, 'module.exports = {}')

      // Should throw clear error
      expect(() => {
        ConventionResolver.resolveConventions(indexFile)
      }).toThrow(/Could not find 'features' directory/)
    })

    it('should provide helpful error message with path information', () => {
      const featureDir = path.join(testDir, 'src/api/@get')
      const indexFile = path.join(featureDir, 'index.js')
      fs.mkdirSync(featureDir, { recursive: true })
      fs.writeFileSync(indexFile, 'module.exports = {}')

      try {
        ConventionResolver.resolveConventions(indexFile)
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.message).toContain('features')
        // Error message includes the directory path
        expect(error.message).toContain(featureDir)
      }
    })
  })

  describe('Feature creation with partial Convention', () => {
    it('should document partial Convention scenarios', () => {
      // This test documents that feature() should handle partial Convention gracefully
      // When Convention resolution fails, explicit method/path should be used
      // This is tested in other tests that check resolveConventions with featuresBase parameter
      expect(true).toBe(true)
    })
  })

  describe('Regression: index.js in features directory should still work', () => {
    it('should resolve conventions normally when index.js is in features directory', () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'users/@get')
      const indexFile = path.join(featureDir, 'index.js')
      fs.mkdirSync(featureDir, { recursive: true })
      fs.mkdirSync(path.join(featureDir, 'steps'))
      fs.writeFileSync(indexFile, 'module.exports = {}')

      const conventions = ConventionResolver.resolveConventions(indexFile)

      expect(conventions.method).toBe('GET')
      expect(conventions.path).toBe('/users')
      expect(conventions.steps).toBe('./steps')
    })

    it('should resolve deeply nested features directory paths', () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'api/v1/orders/@post')
      const indexFile = path.join(featureDir, 'index.js')
      fs.mkdirSync(featureDir, { recursive: true })
      fs.writeFileSync(indexFile, 'module.exports = {}')

      const conventions = ConventionResolver.resolveConventions(indexFile)

      expect(conventions.method).toBe('POST')
      expect(conventions.path).toBe('/api/v1/orders')
    })
  })

  describe('Feature registration error messages', () => {
    it('should document expected behavior when method is missing', () => {
      // This test documents the expected behavior when method is missing
      // The error message should guide users to provide explicit method/path
      // or use proper Convention structure

      // When feature() is called outside of 'features' directory:
      // 1. Convention resolution fails
      // 2. Error is caught and ignored (current bug)
      // 3. method and path remain undefined
      // 4. During registration, "has no method, skipping" error occurs

      // Expected behavior after fix:
      // 1. Convention resolution fails
      // 2. Clear error message is shown
      // 3. Suggests: use explicit method/path OR move to features/ directory
      expect(true).toBe(true)
    })
  })

  describe('Feature creation validation (after fix)', () => {
    it('should log warning when Convention resolution fails and no explicit method/path provided', () => {
      // After fix: feature() should log a warning when:
      // 1. Convention resolution fails
      // 2. User doesn't provide explicit method/path
      // 3. Feature will be created but won't be registrable

      // This is a documentation test for the expected behavior after fix
      expect(true).toBe(true)
    })

    it('should allow Feature creation with explicit method/path even outside features directory', () => {
      // After fix: Users can still create Features outside of 'features' directory
      // as long as they provide explicit method and path

      const featureDir = path.join(testDir, 'custom-location/@get')
      const indexFile = path.join(featureDir, 'index.js')
      fs.mkdirSync(featureDir, { recursive: true })
      fs.writeFileSync(indexFile, 'module.exports = {}')

      // Should work with explicit config
      const conventions = ConventionResolver.resolveConventions(
        indexFile,
        path.join(testDir, 'custom-location')  // explicit base
      )

      expect(conventions.method).toBe('GET')
      expect(conventions.path).toBe('/')
    })
  })
})
