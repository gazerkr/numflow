/**
 * Integration test for inject() module compatibility
 *
 * Tests that inject() works with both ESM and CJS builds
 * This test verifies the fix for "ReferenceError: require is not defined" bug
 */

import * as path from 'path'
import * as fs from 'fs'

describe('inject() Module Compatibility Integration', () => {
  const distDir = path.join(__dirname, '../../dist')
  const cjsDir = path.join(distDir, 'cjs')
  const esmDir = path.join(distDir, 'esm')

  beforeAll(() => {
    // Ensure dist directory exists
    if (!fs.existsSync(distDir)) {
      throw new Error('dist directory not found. Run "npm run build" first.')
    }
  })

  describe('CJS Build', () => {
    it('should have inject() method in CJS build', () => {
      const cjsIndexPath = path.join(cjsDir, 'index.js')
      expect(fs.existsSync(cjsIndexPath)).toBe(true)

      // Load CJS module
      const numflowCJS = require(cjsIndexPath)
      const app = numflowCJS()

      expect(typeof app.inject).toBe('function')
    })

    it('should work with inject() in CJS environment', async () => {
      const numflowCJS = require(path.join(cjsDir, 'index.js'))
      const app = numflowCJS()

      app.get('/test', (_req: any, res: any) => {
        res.json({ module: 'cjs' })
      })

      const response = await app.inject({
        method: 'GET',
        url: '/test'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body.module).toBe('cjs')
    })
  })

  describe('ESM Build', () => {
    it('should have ESM build files', () => {
      const esmIndexPath = path.join(esmDir, 'index.js')
      expect(fs.existsSync(esmIndexPath)).toBe(true)

      const esmPackageJson = path.join(esmDir, 'package.json')
      expect(fs.existsSync(esmPackageJson)).toBe(true)

      const packageContent = JSON.parse(fs.readFileSync(esmPackageJson, 'utf-8'))
      expect(packageContent.type).toBe('module')
    })

    // ESM testing is done in separate scripts (test-esm-inject.mjs)
    // because Jest doesn't support dynamic import() of ESM files well
    it.skip('ESM runtime test (see test-esm-inject.mjs)', () => {
      // This test is covered by test-esm-inject.mjs script
    })
  })

  describe('Dynamic Import in inject()', () => {
    it('should use dynamic import() for light-my-request', async () => {
      // This test verifies that inject() implementation uses dynamic import()
      // by checking the application.js source code
      const appCJSPath = path.join(cjsDir, 'application.js')
      const appESMPath = path.join(esmDir, 'application.js')

      const cjsSource = fs.readFileSync(appCJSPath, 'utf-8')
      const esmSource = fs.readFileSync(appESMPath, 'utf-8')

      // Both should use dynamic import for light-my-request
      // The compiled code should have "import(" somewhere in inject() method
      expect(cjsSource).toContain('light-my-request')
      expect(esmSource).toContain('light-my-request')

      // Should NOT use require('light-my-request') directly
      // (it might be compiled differently, but the pattern shouldn't be in inject)
      const cjsInjectSection = cjsSource.substring(
        cjsSource.indexOf('inject('),
        cjsSource.indexOf('inject(') + 2000
      )
      const esmInjectSection = esmSource.substring(
        esmSource.indexOf('inject('),
        esmSource.indexOf('inject(') + 2000
      )

      // Verify it's using import() not require()
      expect(cjsInjectSection).toContain('import')
      expect(esmInjectSection).toContain('import')
    })
  })

  describe('Regression Test for ESM Bug', () => {
    // ESM-specific regression tests are in test-esm-inject.mjs
    // Jest doesn't support dynamic import() of ESM files well

    it('should not throw error in CJS build (regression test)', async () => {
      const numflowCJS = require(path.join(cjsDir, 'index.js'))
      const app = numflowCJS()

      app.get('/regression-test', (_req: any, res: any) => {
        res.json({ bug: 'fixed' })
      })

      // Verify inject() works without errors
      const response = await app.inject({
        method: 'GET',
        url: '/regression-test'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body.bug).toBe('fixed')
    })

    it('should handle parallel inject() calls in CJS', async () => {
      const numflowCJS = require(path.join(cjsDir, 'index.js'))
      const app = numflowCJS()

      app.get('/parallel/:id', (req: any, res: any) => {
        res.json({ id: req.params.id })
      })

      // Multiple parallel calls should work
      const results = await Promise.all([
        app.inject({ method: 'GET', url: '/parallel/1' }),
        app.inject({ method: 'GET', url: '/parallel/2' }),
        app.inject({ method: 'GET', url: '/parallel/3' }),
      ])

      expect(results).toHaveLength(3)
      results.forEach((res, idx) => {
        expect(res.statusCode).toBe(200)
        const body = JSON.parse(res.payload)
        expect(body.id).toBe(String(idx + 1))
      })
    })

    it.skip('ESM regression test (see test-esm-inject.mjs)', () => {
      // ESM-specific test: "should not throw 'require is not defined'"
      // This is tested in test-esm-inject.mjs script
    })
  })
})
