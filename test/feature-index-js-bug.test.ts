/**
 * Reproducing the actual bug reported by user
 *
 * Bug: When index.js exists in features/test.xml/@get/index.js
 * - With index.js: "has no method, skipping" error
 * - Without index.js: Works fine
 *
 * This is NOT about being outside 'features' directory.
 * This is about index.js file presence breaking Convention resolution.
 */

import * as path from 'path'
import * as fs from 'fs'
import { ConventionResolver } from '../src/feature/convention.js'

describe('Feature index.js Bug Reproduction', () => {
  let testDir: string

  beforeEach(() => {
    testDir = path.join(process.cwd(), 'tmp-test-index-bug-' + Date.now())
    fs.mkdirSync(testDir, { recursive: true })
    ConventionResolver.clearCache()
  })

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
    ConventionResolver.clearCache()
  })

  describe('Bug: index.js causes "has no method" error', () => {
    it('should work WITHOUT index.js (Implicit Feature)', () => {
      // Create features/test.xml/@get/ WITHOUT index.js
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'test.xml/@get')
      const stepsDir = path.join(featureDir, 'steps')

      fs.mkdirSync(stepsDir, { recursive: true })
      fs.writeFileSync(
        path.join(stepsDir, '100-handler.js'),
        'module.exports = (ctx, req, res) => { res.end("OK") }'
      )

      // Implicit Feature should work
      // This is handled by feature-scanner.ts, not feature()
      // So we test Convention resolution directly
      const conventions = ConventionResolver.resolveConventions(
        path.join(featureDir, 'dummy.js'),  // Simulate a file in the directory
        featuresDir
      )

      expect(conventions.method).toBe('GET')
      expect(conventions.path).toBe('/test.xml')
    })

    it('should reproduce bug WITH index.js (Explicit Feature)', () => {
      // Create features/test.xml/@get/index.js WITH index.js
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'test.xml/@get')
      const indexFile = path.join(featureDir, 'index.js')

      fs.mkdirSync(featureDir, { recursive: true })

      // Write index.js
      fs.writeFileSync(indexFile, `
        const { feature } = require('../../../../dist/cjs/index.js')
        module.exports = feature({
          contextInitializer: (ctx, req, res) => {
            ctx.test = true
          }
        })
      `)

      // Test Convention resolution with index.js path
      const conventions = ConventionResolver.resolveConventions(indexFile, featuresDir)

      // This should work!
      expect(conventions.method).toBe('GET')
      expect(conventions.path).toBe('/test.xml')
    })

    it('should test getCallerPath() with test.xml folder', () => {
      // Test if getCallerPath() correctly identifies user file
      // when the path contains 'test.xml'

      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'test.xml/@get')
      const indexFile = path.join(featureDir, 'index.js')

      fs.mkdirSync(featureDir, { recursive: true })
      fs.writeFileSync(indexFile, 'module.exports = {}')

      // Check if getCallerPath() works correctly
      const callerPath = ConventionResolver.getCallerPath()

      // Should return a valid path
      expect(callerPath).toBeTruthy()
      expect(callerPath).not.toBe('')
    })

    it('should check if path.dirname works correctly with index.js', () => {
      const indexFile = '/features/test.xml/@get/index.js'
      const featureDir = path.dirname(indexFile)

      expect(featureDir).toBe('/features/test.xml/@get')
    })

    it('should verify Convention resolution step by step', () => {
      const featuresDir = path.join(testDir, 'features')
      const featureDir = path.join(featuresDir, 'test.xml/@get')
      const indexFile = path.join(featureDir, 'index.js')

      fs.mkdirSync(featureDir, { recursive: true })
      fs.writeFileSync(indexFile, 'module.exports = {}')

      // Step 1: getCallerPath() should return indexFile
      // (we can't test this directly without actually calling feature())

      // Step 2: path.dirname(indexFile) should return featureDir
      const dir = path.dirname(indexFile)
      expect(dir).toBe(featureDir)

      // Step 3: findFeaturesBaseDir should find 'features'
      const base = ConventionResolver.findFeaturesBaseDir(dir)
      expect(base).toBe(featuresDir)

      // Step 4: inferMethod should return 'GET'
      const method = ConventionResolver.inferMethod(dir)
      expect(method).toBe('GET')

      // Step 5: inferPath should return '/test.xml'
      const apiPath = ConventionResolver.inferPath(dir, base)
      expect(apiPath).toBe('/test.xml')

      // Step 6: Full resolution should work
      const conventions = ConventionResolver.resolveConventions(indexFile, featuresDir)
      expect(conventions.method).toBe('GET')
      expect(conventions.path).toBe('/test.xml')
    })
  })

  describe('Debug getCallerPath() behavior', () => {
    it('should log stack trace to understand getCallerPath()', () => {
      // This test helps us understand what's happening in getCallerPath()

      const originalPrepareStackTrace = Error.prepareStackTrace
      const err = new Error()
      let stackInfo: string[] = []

      try {
        Error.prepareStackTrace = (_, stack) => stack
        const stack = err.stack as unknown as NodeJS.CallSite[]

        for (let i = 0; i < Math.min(stack.length, 10); i++) {
          const fileName = stack[i].getFileName()
          if (fileName) {
            stackInfo.push(fileName)
          }
        }
      } finally {
        Error.prepareStackTrace = originalPrepareStackTrace
      }

      // Log stack for debugging
      console.log('Stack trace:', stackInfo)

      expect(stackInfo.length).toBeGreaterThan(0)
    })
  })
})
