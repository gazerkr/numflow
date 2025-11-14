/**
 * Manual Configuration Override Tests
 *
 * Verifies that manual configuration properly overrides auto-inferred Convention values
 *
 * Test scenarios:
 * 1. method override: Convention suggests POST, manual config sets GET → GET wins
 * 2. path override: Convention suggests /users, manual config sets /custom → /custom wins
 * 3. steps override: Convention detects ./steps, manual config sets ./custom-steps → custom-steps wins
 * 4. asyncTasks override: Convention detects ./async-tasks, manual config sets ./custom-tasks → custom-tasks wins
 * 5. Mixed: Some auto-inferred, some manually configured
 */

import * as path from 'path'
import * as fs from 'fs'
import { Feature } from '../src/feature/index.js'
import { ConventionResolver } from '../src/feature/convention.js'

describe('Feature Manual Configuration Override', () => {
  const fixturesBase = path.join(process.cwd(), 'test/__fixtures__/feature-manual-override')

  beforeAll(() => {
    // Clear convention cache before tests
    ConventionResolver.clearCache()
  })

  afterEach(() => {
    // Clear cache after each test
    ConventionResolver.clearCache()
  })

  describe('Method Override', () => {
    it('should override auto-inferred method with manual configuration', () => {
      // Convention folder: features/users/@post/ → suggests POST
      const featureDir = path.join(fixturesBase, 'features/users/@post')

      // Auto-inference from folder structure
      const conventions = ConventionResolver.resolveConventions(
        path.join(featureDir, 'index.js'),
        path.join(fixturesBase, 'features')
      )

      expect(conventions.method).toBe('POST') // Convention suggests POST
      expect(conventions.path).toBe('/users')

      // Manual override: method = 'GET'
      const testFeature = new Feature(
        {
          method: 'GET', // Override to GET
          path: conventions.path, // Keep convention path
        },
        featureDir
      )

      const info = testFeature.getInfo()
      expect(info.method).toBe('GET') // Manual config wins!
      expect(info.path).toBe('/users')
    })

    it('should use auto-inferred method when manual config is not provided', () => {
      // Convention folder: features/orders/@delete/ → suggests DELETE
      const featureDir = path.join(fixturesBase, 'features/orders/@delete')

      const conventions = ConventionResolver.resolveConventions(
        path.join(featureDir, 'index.js'),
        path.join(fixturesBase, 'features')
      )

      expect(conventions.method).toBe('DELETE')

      // No manual method config → merge with conventions
      const mergedConfig = {
        method: conventions.method, // No override → uses convention
        path: conventions.path,
      }

      const testFeature = new Feature(mergedConfig, featureDir)

      const info = testFeature.getInfo()
      expect(info.method).toBe('DELETE') // Convention wins
    })
  })

  describe('Path Override', () => {
    it('should override auto-inferred path with manual configuration', () => {
      // Convention folder: features/api/v1/users/@get/ → suggests /api/v1/users
      const featureDir = path.join(fixturesBase, 'features/api/v1/users/@get')

      const conventions = ConventionResolver.resolveConventions(
        path.join(featureDir, 'index.js'),
        path.join(fixturesBase, 'features')
      )

      expect(conventions.method).toBe('GET')
      expect(conventions.path).toBe('/api/v1/users') // Convention suggests this path

      // Manual override: path = '/custom/endpoint'
      const testFeature = new Feature(
        {
          method: conventions.method,
          path: '/custom/endpoint', // Override to custom path
        },
        featureDir
      )

      const info = testFeature.getInfo()
      expect(info.method).toBe('GET')
      expect(info.path).toBe('/custom/endpoint') // Manual config wins!
    })

    it('should support dynamic route override', () => {
      // Convention folder: features/items/[id]/@put/ → suggests /items/:id
      const featureDir = path.join(fixturesBase, 'features/items/[id]/@put')

      const conventions = ConventionResolver.resolveConventions(
        path.join(featureDir, 'index.js'),
        path.join(fixturesBase, 'features')
      )

      expect(conventions.path).toBe('/items/:id')

      // Manual override: different dynamic route
      const testFeature = new Feature(
        {
          method: conventions.method,
          path: '/products/:productId/details', // Override with different route
        },
        featureDir
      )

      const info = testFeature.getInfo()
      expect(info.path).toBe('/products/:productId/details') // Manual config wins!
    })
  })

  describe('Steps Override', () => {
    it('should override auto-detected steps folder with manual configuration', async () => {
      // Create fixture with both ./steps and ./custom-steps
      const featureDir = path.join(fixturesBase, 'features/products/@post')
      const stepsDir = path.join(featureDir, 'steps')
      const customStepsDir = path.join(featureDir, 'custom-steps')

      // Create directories
      fs.mkdirSync(stepsDir, { recursive: true })
      fs.mkdirSync(customStepsDir, { recursive: true })

      // Create step files (CommonJS format)
      fs.writeFileSync(
        path.join(stepsDir, '100-step.js'),
        'module.exports = async function step1() { return "default-step" }'
      )
      fs.writeFileSync(
        path.join(customStepsDir, '100-custom.js'),
        'module.exports = async function step2() { return "custom-step" }'
      )

      try {
        const conventions = ConventionResolver.resolveConventions(
          path.join(featureDir, 'index.js'),
          path.join(fixturesBase, 'features')
        )

        expect(conventions.steps).toBe('./steps') // Convention detects ./steps

        // Manual override: steps = './custom-steps'
        const testFeature = new Feature(
          {
            method: conventions.method,
            path: conventions.path,
            steps: './custom-steps', // Override to custom-steps
          },
          featureDir
        )

        await testFeature.initialize()
        const info = testFeature.getInfo()

        expect(info.steps).toBe(1) // 1 step from custom-steps
      } finally {
        // Cleanup
        fs.rmSync(stepsDir, { recursive: true, force: true })
        fs.rmSync(customStepsDir, { recursive: true, force: true })
      }
    })

    it('should disable steps when manual config sets steps to undefined', async () => {
      const featureDir = path.join(fixturesBase, 'features/todos/@get')
      const stepsDir = path.join(featureDir, 'steps')

      // Create steps directory
      fs.mkdirSync(stepsDir, { recursive: true })
      fs.writeFileSync(
        path.join(stepsDir, '100-step.js'),
        'module.exports = async function step() {}'
      )

      try {
        const conventions = ConventionResolver.resolveConventions(
          path.join(featureDir, 'index.js'),
          path.join(fixturesBase, 'features')
        )

        expect(conventions.steps).toBe('./steps') // Convention detects steps

        // Manual override: explicitly disable steps
        const testFeature = new Feature(
          {
            method: conventions.method,
            path: conventions.path,
            steps: undefined, // Explicitly disable
          },
          featureDir
        )

        await testFeature.initialize()
        const info = testFeature.getInfo()

        expect(info.steps).toBe(0) // No steps loaded
      } finally {
        // Cleanup
        fs.rmSync(stepsDir, { recursive: true, force: true })
      }
    })
  })

  describe('AsyncTasks Override', () => {
    it('should override auto-detected async-tasks folder with manual configuration', async () => {
      const featureDir = path.join(fixturesBase, 'features/notifications/@post')
      const asyncTasksDir = path.join(featureDir, 'async-tasks')
      const customTasksDir = path.join(featureDir, 'custom-tasks')

      // Create directories
      fs.mkdirSync(asyncTasksDir, { recursive: true })
      fs.mkdirSync(customTasksDir, { recursive: true })

      // Create task files (CommonJS format)
      fs.writeFileSync(
        path.join(asyncTasksDir, 'default-task.js'),
        'module.exports = async function task1() {}'
      )
      fs.writeFileSync(
        path.join(customTasksDir, 'custom-task.js'),
        'module.exports = async function task2() {}'
      )

      try {
        const conventions = ConventionResolver.resolveConventions(
          path.join(featureDir, 'index.js'),
          path.join(fixturesBase, 'features')
        )

        expect(conventions.asyncTasks).toBe('./async-tasks')

        // Manual override: asyncTasks = './custom-tasks'
        const testFeature = new Feature(
          {
            method: conventions.method,
            path: conventions.path,
            asyncTasks: './custom-tasks', // Override
          },
          featureDir
        )

        await testFeature.initialize()
        const info = testFeature.getInfo()

        expect(info.asyncTasks).toBe(1) // 1 task from custom-tasks
      } finally {
        // Cleanup
        fs.rmSync(asyncTasksDir, { recursive: true, force: true })
        fs.rmSync(customTasksDir, { recursive: true, force: true })
      }
    })
  })

  describe('Mixed Auto-Inference and Manual Configuration', () => {
    it('should allow mixing auto-inferred and manual configurations', () => {
      // Convention folder: features/api/admin/users/@delete/
      const featureDir = path.join(fixturesBase, 'features/api/admin/users/@delete')

      const conventions = ConventionResolver.resolveConventions(
        path.join(featureDir, 'index.js'),
        path.join(fixturesBase, 'features')
      )

      expect(conventions.method).toBe('DELETE')
      expect(conventions.path).toBe('/api/admin/users')

      // Mixed: Keep method from convention, override path
      const testFeature = new Feature(
        {
          method: conventions.method, // Keep DELETE
          path: '/admin/remove-user', // Override path
          // steps and asyncTasks will use conventions
        },
        featureDir
      )

      const info = testFeature.getInfo()
      expect(info.method).toBe('DELETE') // From convention
      expect(info.path).toBe('/admin/remove-user') // From manual config
    })

    it('should support partial override - only method', () => {
      const featureDir = path.join(fixturesBase, 'features/reports/@get')

      const conventions = ConventionResolver.resolveConventions(
        path.join(featureDir, 'index.js'),
        path.join(fixturesBase, 'features')
      )

      // Only override method, let path use convention
      const mergedConfig = {
        method: 'POST' as const, // Override to POST
        path: conventions.path, // Use convention '/reports'
      }

      const testFeature = new Feature(mergedConfig, featureDir)

      const info = testFeature.getInfo()
      expect(info.method).toBe('POST') // Manual override
      expect(info.path).toBe('/reports') // Convention
    })

    it('should support partial override - only path', () => {
      const featureDir = path.join(fixturesBase, 'features/analytics/@post')

      const conventions = ConventionResolver.resolveConventions(
        path.join(featureDir, 'index.js'),
        path.join(fixturesBase, 'features')
      )

      // Only override path, let method use convention
      const mergedConfig = {
        method: conventions.method, // Use convention 'POST'
        path: '/metrics/track', // Override path
      }

      const testFeature = new Feature(mergedConfig, featureDir)

      const info = testFeature.getInfo()
      expect(info.method).toBe('POST') // Convention
      expect(info.path).toBe('/metrics/track') // Manual override
    })
  })

  describe('Complete Manual Configuration (No Convention)', () => {
    it('should work with complete manual configuration outside features folder', () => {
      // Not in features folder → no convention inference
      const featureDir = path.join(process.cwd(), 'test/__fixtures__/manual-only')

      // Complete manual configuration
      const testFeature = new Feature(
        {
          method: 'PUT',
          path: '/fully/manual/endpoint',
          steps: './manual-steps',
          asyncTasks: './manual-tasks',
        },
        featureDir
      )

      const info = testFeature.getInfo()
      expect(info.method).toBe('PUT')
      expect(info.path).toBe('/fully/manual/endpoint')
    })
  })

  describe('Priority Verification', () => {
    it('should confirm manual config always takes priority over convention', () => {
      // Convention: POST /api/v1/orders
      const featureDir = path.join(fixturesBase, 'features/api/v1/orders/@post')

      const conventions = ConventionResolver.resolveConventions(
        path.join(featureDir, 'index.js'),
        path.join(fixturesBase, 'features')
      )

      // Completely override everything
      const testFeature = new Feature(
        {
          method: 'GET', // Override POST → GET
          path: '/custom', // Override /api/v1/orders → /custom
        },
        featureDir
      )

      const info = testFeature.getInfo()

      // Manual config wins everything
      expect(info.method).toBe('GET')
      expect(info.path).toBe('/custom')

      // Verify convention was different
      expect(conventions.method).toBe('POST')
      expect(conventions.path).toBe('/api/v1/orders')
    })
  })
})
