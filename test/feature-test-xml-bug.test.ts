/**
 * Integration test: Reproduce actual bug with test.xml folder
 *
 * Bug report:
 * - features/test.xml/@get/index.js exists → "has no method, skipping"
 * - features/test.xml/@get/ without index.js → works fine
 *
 * This test actually loads the Feature and checks if it works
 */

import * as path from 'path'
import numflow from '../src/index.js'

describe('Bug: features/test.xml/@get/index.js', () => {
  it('should load Feature from test-fixtures/features/test.xml/@get/index.js', () => {
    // Load the feature module
    const featureModule = require('../test-fixtures/features/test.xml/@get/index.js')

    console.log('Feature module:', featureModule)
    console.log('Feature info:', featureModule.getInfo())

    const info = featureModule.getInfo()

    // Check if method and path are correctly resolved
    console.log('Method:', info.method)
    console.log('Path:', info.path)

    expect(info.method).toBeDefined()
    expect(info.path).toBeDefined()

    // This is the bug! method and path might be undefined
    if (!info.method || !info.path) {
      console.error('BUG REPRODUCED: method or path is undefined!')
    }
  })

  it('should auto-register using registerFeatures()', async () => {
    const app = numflow()

    // Auto-register all features from directory
    const featuresPath = path.join(__dirname, '../test-fixtures/features')

    console.log('Auto-registering features from:', featuresPath)

    app.registerFeatures(featuresPath)

    // Start server (wait for feature registration to complete)
    await new Promise<void>((resolve) => {
      app.listen(0, () => {
        console.log('Server started with auto-registered features')
        resolve()
      })
    })

    // Make HTTP request
    const response = await app.inject({
      method: 'GET',
      url: '/test.xml'
    })

    console.log('Auto-registration response status:', response.statusCode)
    console.log('Auto-registration response body:', response.body)

    // Close server
    await new Promise<void>((resolve) => {
      app.close(() => resolve())
    })
  })
})
