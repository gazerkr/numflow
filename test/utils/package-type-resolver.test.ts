/**
 * Package Type Resolver Tests
 *
 * TDD: Tests for module type resolution based on file extension and package.json
 *
 * Key scenarios:
 * 1. Explicit extensions (.mjs, .cjs, .mts, .cts) always determine type
 * 2. .js and .ts files check nearest package.json "type" field
 * 3. Default to commonjs when no package.json or "type" field
 */

import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { resolveModuleType, clearPackageTypeCache } from '../../src/utils/package-type-resolver.js'

describe('Package Type Resolver', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'numflow-pkg-type-test-'))
    clearPackageTypeCache()
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('Explicit extensions', () => {
    it('should return esm for .mjs files', () => {
      const filePath = path.join(tempDir, 'module.mjs')
      expect(resolveModuleType(filePath)).toBe('esm')
    })

    it('should return esm for .mts files', () => {
      const filePath = path.join(tempDir, 'module.mts')
      expect(resolveModuleType(filePath)).toBe('esm')
    })

    it('should return commonjs for .cjs files', () => {
      const filePath = path.join(tempDir, 'module.cjs')
      expect(resolveModuleType(filePath)).toBe('commonjs')
    })

    it('should return commonjs for .cts files', () => {
      const filePath = path.join(tempDir, 'module.cts')
      expect(resolveModuleType(filePath)).toBe('commonjs')
    })
  })

  describe('Package.json type field', () => {
    it('should return esm for .js files when package.json has type: module', () => {
      // Create package.json with type: module
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ type: 'module' })
      )

      const filePath = path.join(tempDir, 'index.js')
      expect(resolveModuleType(filePath)).toBe('esm')
    })

    it('should return esm for .ts files when package.json has type: module', () => {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ type: 'module' })
      )

      const filePath = path.join(tempDir, 'index.ts')
      expect(resolveModuleType(filePath)).toBe('esm')
    })

    it('should return commonjs for .js files when package.json has type: commonjs', () => {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ type: 'commonjs' })
      )

      const filePath = path.join(tempDir, 'index.js')
      expect(resolveModuleType(filePath)).toBe('commonjs')
    })

    it('should return commonjs for .js files when package.json has no type field', () => {
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ name: 'test-package' })
      )

      const filePath = path.join(tempDir, 'index.js')
      expect(resolveModuleType(filePath)).toBe('commonjs')
    })
  })

  describe('Nested directory package.json lookup', () => {
    it('should find package.json in parent directory', () => {
      // Create nested directory structure
      const nestedDir = path.join(tempDir, 'src', 'feature', 'steps')
      fs.mkdirSync(nestedDir, { recursive: true })

      // Create package.json at root
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ type: 'module' })
      )

      const filePath = path.join(nestedDir, '100-validate.js')
      expect(resolveModuleType(filePath)).toBe('esm')
    })

    it('should use nearest package.json (override parent)', () => {
      // Create nested directory structure
      const nestedDir = path.join(tempDir, 'packages', 'sub-package')
      fs.mkdirSync(nestedDir, { recursive: true })

      // Root package.json with type: module
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ type: 'module' })
      )

      // Nested package.json with type: commonjs
      fs.writeFileSync(
        path.join(nestedDir, 'package.json'),
        JSON.stringify({ type: 'commonjs' })
      )

      const filePath = path.join(nestedDir, 'index.js')
      expect(resolveModuleType(filePath)).toBe('commonjs')
    })
  })

  describe('No package.json', () => {
    it('should return commonjs when no package.json exists', () => {
      const filePath = path.join(tempDir, 'orphan.js')
      expect(resolveModuleType(filePath)).toBe('commonjs')
    })
  })

  describe('Unknown extensions', () => {
    it('should return commonjs for unknown extensions', () => {
      const filePath = path.join(tempDir, 'file.xyz')
      expect(resolveModuleType(filePath)).toBe('commonjs')
    })
  })

  describe('Caching', () => {
    it('should cache package.json lookups', () => {
      // Create package.json
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ type: 'module' })
      )

      const filePath1 = path.join(tempDir, 'file1.js')
      const filePath2 = path.join(tempDir, 'file2.js')

      // First call
      expect(resolveModuleType(filePath1)).toBe('esm')

      // Second call should use cache
      expect(resolveModuleType(filePath2)).toBe('esm')
    })

    it('should clear cache when clearPackageTypeCache is called', () => {
      // Create package.json with type: module
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ type: 'module' })
      )

      const filePath = path.join(tempDir, 'index.js')
      expect(resolveModuleType(filePath)).toBe('esm')

      // Clear cache
      clearPackageTypeCache()

      // Modify package.json to type: commonjs
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ type: 'commonjs' })
      )

      // Should reflect the change
      expect(resolveModuleType(filePath)).toBe('commonjs')
    })
  })
})
