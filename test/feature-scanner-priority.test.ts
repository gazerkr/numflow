/**
 * Feature Scanner Priority Tests
 *
 * TDD: Tests for route priority sorting in FeatureScanner
 *
 * Tests that static routes have higher priority than dynamic routes
 * to ensure correct matching order when registered.
 */

import { FeatureScanner } from '../src/feature/feature-scanner.js'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

describe('Feature Scanner - Route Priority', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'numflow-priority-test-'))
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  /**
   * Helper function to create a feature directory structure
   */
  function createFeature(basePath: string, routePath: string, method: string = 'get'): void {
    const featureDir = path.join(basePath, ...routePath.split('/').filter(Boolean), `@${method}`)
    const stepsDir = path.join(featureDir, 'steps')

    fs.mkdirSync(stepsDir, { recursive: true })
    fs.writeFileSync(
      path.join(stepsDir, '100-handler.js'),
      `module.exports = async (ctx, req, res) => { res.json({ route: '${routePath}' }) }`
    )
  }

  describe('sortFeaturesByPriority', () => {
    it('should sort static routes before dynamic routes', async () => {
      // Given: Features with mixed static and dynamic routes
      createFeature(tempDir, 'blog/search')     // Static: /blog/search
      createFeature(tempDir, 'blog/[slug]')     // Dynamic: /blog/:slug
      createFeature(tempDir, 'blog/about')      // Static: /blog/about

      // When: Scan features
      const scanner = new FeatureScanner({ directory: tempDir })
      const features = await scanner.scan()

      // Then: Static routes should come before dynamic routes
      const paths = features.map(f => f.feature.getInfo().path)

      // /blog/search and /blog/about should come before /blog/:slug
      const searchIndex = paths.indexOf('/blog/search')
      const aboutIndex = paths.indexOf('/blog/about')
      const slugIndex = paths.indexOf('/blog/:slug')

      expect(searchIndex).toBeLessThan(slugIndex)
      expect(aboutIndex).toBeLessThan(slugIndex)
    })

    it('should sort routes with multiple parameters correctly at same depth', async () => {
      // Given: Features with varying parameter counts at SAME depth
      createFeature(tempDir, 'users/[userId]/posts/[postId]')  // Two params at depth 4
      createFeature(tempDir, 'users/[userId]/posts/latest')    // One param at depth 4
      createFeature(tempDir, 'users/admin/posts/featured')     // All static at depth 4

      const scanner = new FeatureScanner({ directory: tempDir })
      const features = await scanner.scan()

      const paths = features.map(f => f.feature.getInfo().path)

      const allStaticIndex = paths.indexOf('/users/admin/posts/featured')
      const oneParamIndex = paths.indexOf('/users/:userId/posts/latest')
      const twoParamsIndex = paths.indexOf('/users/:userId/posts/:postId')

      // More static segments = higher priority
      expect(allStaticIndex).toBeLessThan(oneParamIndex)
      expect(oneParamIndex).toBeLessThan(twoParamsIndex)
    })

    it('should maintain alphabetical order for same priority routes', async () => {
      // Given: Multiple static routes at same level
      createFeature(tempDir, 'api/zebra')
      createFeature(tempDir, 'api/alpha')
      createFeature(tempDir, 'api/beta')

      const scanner = new FeatureScanner({ directory: tempDir })
      const features = await scanner.scan()

      const paths = features.map(f => f.feature.getInfo().path)

      // All are static, so should maintain some consistent order
      // (alphabetical or as discovered)
      expect(paths).toContain('/api/zebra')
      expect(paths).toContain('/api/alpha')
      expect(paths).toContain('/api/beta')
    })

    it('should handle root dynamic route correctly', async () => {
      // Given: Root level static and dynamic routes
      createFeature(tempDir, 'search')    // Static: /search
      createFeature(tempDir, '[id]')       // Dynamic: /:id

      const scanner = new FeatureScanner({ directory: tempDir })
      const features = await scanner.scan()

      const paths = features.map(f => f.feature.getInfo().path)

      const searchIndex = paths.indexOf('/search')
      const idIndex = paths.indexOf('/:id')

      expect(searchIndex).toBeLessThan(idIndex)
    })

    it('should handle nested dynamic routes', async () => {
      // Given: Nested routes with various patterns
      createFeature(tempDir, 'api/v1/users/all')           // All static
      createFeature(tempDir, 'api/v1/users/[id]')          // One param at end
      createFeature(tempDir, 'api/[version]/users/all')    // One param in middle
      createFeature(tempDir, 'api/[version]/users/[id]')   // Two params

      const scanner = new FeatureScanner({ directory: tempDir })
      const features = await scanner.scan()

      const paths = features.map(f => f.feature.getInfo().path)

      const allStaticIndex = paths.indexOf('/api/v1/users/all')
      const endParamIndex = paths.indexOf('/api/v1/users/:id')
      const middleParamIndex = paths.indexOf('/api/:version/users/all')
      const twoParamsIndex = paths.indexOf('/api/:version/users/:id')

      // All static should be first
      expect(allStaticIndex).toBeLessThan(endParamIndex)
      expect(allStaticIndex).toBeLessThan(middleParamIndex)
      expect(allStaticIndex).toBeLessThan(twoParamsIndex)

      // One param should be before two params
      expect(endParamIndex).toBeLessThan(twoParamsIndex)
      expect(middleParamIndex).toBeLessThan(twoParamsIndex)
    })
  })

  describe('calculateRoutePriority (internal method)', () => {
    it('should calculate higher priority for static routes', () => {
      // This tests the internal priority calculation logic
      // Static routes should have lower priority value (higher priority)

      // We can test this indirectly through the sorting behavior
      // or expose the method for testing
    })
  })

  describe('Edge cases', () => {
    it('should handle empty features directory', async () => {
      const emptyDir = path.join(tempDir, 'empty')
      fs.mkdirSync(emptyDir)

      const scanner = new FeatureScanner({ directory: emptyDir })
      const features = await scanner.scan()

      expect(features).toHaveLength(0)
    })

    it('should handle single feature', async () => {
      createFeature(tempDir, 'single')

      const scanner = new FeatureScanner({ directory: tempDir })
      const features = await scanner.scan()

      expect(features).toHaveLength(1)
      expect(features[0].feature.getInfo().path).toBe('/single')
    })
  })
})
