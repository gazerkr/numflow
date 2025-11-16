#!/usr/bin/env node

/**
 * Documentation-Code Consistency Verification Script
 *
 * Purpose: Automatically verify if APIs documented are actually implemented
 *
 * Verification Steps:
 * 1. Extract method list from API documentation
 * 2. Check actual implementation in source code
 * 3. Check test code existence
 * 4. Check example code
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Extract methods from API documentation
function extractAPIsFromDoc(docPath) {
  const content = fs.readFileSync(docPath, 'utf-8')
  const apis = []

  // Method 1: Extract APIs from markdown headings (### app.method(), ### method())
  const headingRegex = /^###\s+([a-zA-Z0-9_.]+(?:\([^)]*\))?)/gm
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const api = match[1].trim()
    // Exclude common section headers
    if (api &&
        !api.includes('(req, res') &&
        !api.includes('(err, req, res') &&
        api !== 'Overview' &&
        api !== 'Examples' &&
        api.includes('.') &&  // Must be in object.method format
        api.length > 3) {     // Exclude too short names
      apis.push(api)
    }
  }

  // Method 2: Extract APIs from markdown tables (| API | Status | ...)
  const tableRegex = /\|\s*([a-zA-Z0-9_.()[\]]+)\s*\|/g

  while ((match = tableRegex.exec(content)) !== null) {
    const api = match[1].trim()
    // Exclude headers and status columns
    if (api &&
        api !== 'API' &&
        api !== 'Status' &&
        api !== 'Compatibility' &&
        api !== 'Notes' &&
        api !== '상태' &&
        api !== '호환성' &&
        api !== '비고' &&
        api !== 'Lifecycle' &&
        api !== 'Configuration' &&
        api !== 'Routing' &&
        api !== 'Middleware' &&
        api !== 'Template' &&
        api !== 'Others' &&
        api !== 'Events' &&
        api !== 'Properties' &&
        api !== 'Methods' &&
        !api.includes('---') &&
        !api.includes('**')) {
      apis.push(api)
    }
  }

  // Exclude incorrectly extracted APIs
  const excludeList = [
    'RESTful', 'HTTP', 'Best', 'Dynamic', 'AutoExecutor', 'Debug',
    'false', 'Option', 'Description', 'Variable', 'Performance', 'ErrorHandler',
    'router.METHOD', 'METHOD'
  ]

  const filteredApis = apis.filter(api => {
    const fullName = api.replace(/\(.*\)/, '').replace(/\[.*\]/, '')
    // Exclude numbers or too short names
    if (/^\d+\.$/.test(fullName) || fullName.length <= 2) {
      return false
    }
    // Exclude items in exclude list
    if (excludeList.includes(fullName) || excludeList.some(ex => fullName.includes(ex))) {
      return false
    }
    return true
  })

  return [...new Set(filteredApis)] // Remove duplicates
}

// Check method implementation in source code
function checkImplementation(api, sourceDir) {
  try {
    // Extract actual method name from API name
    const fullName = api.replace(/\(.*\)/, '').replace(/\[.*\]/, '')

    // Skip numbers or too short names (likely section titles)
    if (/^\d+\.$/.test(fullName) || fullName.length <= 2) {
      return { exists: false, locations: 0 }
    }

    // Exclude common section titles
    const excludeList = [
      'RESTful', 'HTTP', 'Best', 'Dynamic', 'AutoExecutor', 'Debug',
      'false', 'Option', 'Description', 'Variable', 'Performance', 'ErrorHandler',
      'router.METHOD', 'METHOD'
    ]
    if (excludeList.includes(fullName) || excludeList.some(ex => fullName.includes(ex))) {
      return { exists: false, locations: 0 }
    }

    // Split object.method format (e.g., req.get → get)
    const parts = fullName.split('.')
    const methodName = parts.length > 1 ? parts[parts.length - 1] : fullName

    // Simple search: Search by method/property name
    const grepCmd = `grep -r "${methodName}" ${sourceDir} --include="*.ts" --include="*.js" 2>/dev/null || true`
    const result = execSync(grepCmd, { encoding: 'utf-8' })

    // Check if results exist and contain actual defining code
    if (result.length > 10) {
      const lines = result.split('\n').filter(line => {
        const trimmed = line.trim()
        return trimmed &&
               // Pattern that looks like function or property definition
               (trimmed.includes(`${methodName} =`) ||
                trimmed.includes(`${methodName}:`) ||
                trimmed.includes(`${methodName}(`) ||
                trimmed.includes(`.${methodName}`) ||
                trimmed.includes(`'${methodName}'`) ||
                trimmed.includes(`"${methodName}"`))
      })

      return {
        exists: lines.length > 0,
        locations: lines.length
      }
    }

    return { exists: false, locations: 0 }
  } catch (error) {
    return { exists: false, locations: 0 }
  }
}

// Check test code existence
function checkTests(api, testDir) {
  try {
    const methodName = api.replace(/\(.*\)/, '').replace(/\[.*\]/, '')

    const grepCmd = `grep -r "${methodName}" ${testDir} --include="*.test.ts" --include="*.test.js" --include="*.spec.ts" 2>/dev/null || true`
    const result = execSync(grepCmd, { encoding: 'utf-8' })

    return {
      exists: result.length > 0,
      count: result.split('\n').filter(line => line.includes('it(') || line.includes('test(')).length
    }
  } catch (error) {
    return { exists: false, count: 0 }
  }
}

// Check example code
function checkExamples(api, examplesDir) {
  try {
    const methodName = api.replace(/\(.*\)/, '').replace(/\[.*\]/, '')

    const grepCmd = `grep -r "${methodName}" ${examplesDir} --include="*.js" --include="*.ts" 2>/dev/null || true`
    const result = execSync(grepCmd, { encoding: 'utf-8' })

    return {
      exists: result.length > 0,
      count: result.split('\n').filter(line => line.trim()).length
    }
  } catch (error) {
    return { exists: false, count: 0 }
  }
}

// Main verification function
function verifyDocumentation(docsLang = 'ko') {
  log('\n═══════════════════════════════════════════════════', 'cyan')
  log(`   Documentation-Code Consistency Verification Started (${docsLang})`, 'cyan')
  log('═══════════════════════════════════════════════════\n', 'cyan')

  const rootDir = path.join(__dirname, '..')
  const docsDir = path.join(rootDir, `docs/${docsLang}`)
  const sourceDir = path.join(rootDir, 'src')
  const testDir = path.join(rootDir, 'test')
  const examplesDir = path.join(rootDir, 'examples')

  // API documentation list
  const apiDocs = [
    { name: 'Application', path: path.join(docsDir, 'api/application.md') },
    { name: 'Request', path: path.join(docsDir, 'api/request.md') },
    { name: 'Response', path: path.join(docsDir, 'api/response.md') },
    { name: 'Router', path: path.join(docsDir, 'api/router.md') },
    { name: 'Feature', path: path.join(docsDir, 'api/feature.md') }
  ]

  const results = []
  let totalAPIs = 0
  let implementedAPIs = 0
  let testedAPIs = 0
  let exampleAPIs = 0

  for (const doc of apiDocs) {
    if (!fs.existsSync(doc.path)) {
      log(`⚠️  Document not found: ${doc.name}`, 'yellow')
      continue
    }

    log(`\n📄 Verifying: ${doc.name}`, 'blue')
    log('─'.repeat(50), 'blue')

    const apis = extractAPIsFromDoc(doc.path)
    totalAPIs += apis.length

    log(`   Extracted APIs: ${apis.length}`, 'cyan')

    const docResults = []

    for (const api of apis) {
      const impl = checkImplementation(api, sourceDir)
      const tests = checkTests(api, testDir)
      const examples = checkExamples(api, examplesDir)

      if (impl.exists) implementedAPIs++
      if (tests.exists) testedAPIs++
      if (examples.exists) exampleAPIs++

      const result = {
        api,
        implemented: impl.exists,
        implLocations: impl.locations,
        tested: tests.exists,
        testCount: tests.count,
        hasExamples: examples.exists,
        exampleCount: examples.count
      }

      docResults.push(result)

      // Output results
      const implStatus = impl.exists ? '✅' : '❌'
      const testStatus = tests.exists ? '✅' : '⚠️ '
      const exampleStatus = examples.exists ? '✅' : '  '

      log(`   ${implStatus} ${testStatus} ${exampleStatus} ${api}`,
          impl.exists ? 'green' : 'red')
    }

    results.push({ doc: doc.name, apis: docResults })
  }

  // Summary report
  log('\n═══════════════════════════════════════════════════', 'cyan')
  log('   Verification Results Summary', 'cyan')
  log('═══════════════════════════════════════════════════\n', 'cyan')

  log(`Total APIs:         ${totalAPIs}`, 'bold')
  log(`Implemented APIs:   ${implementedAPIs} (${Math.round(implementedAPIs/totalAPIs*100)}%)`,
      implementedAPIs === totalAPIs ? 'green' : 'yellow')
  log(`Tested APIs:        ${testedAPIs} (${Math.round(testedAPIs/totalAPIs*100)}%)`,
      testedAPIs > totalAPIs * 0.8 ? 'green' : 'yellow')
  log(`APIs with Examples: ${exampleAPIs} (${Math.round(exampleAPIs/totalAPIs*100)}%)`,
      exampleAPIs > totalAPIs * 0.5 ? 'green' : 'yellow')

  // Detailed report
  log('\n📊 Detailed Report by Category\n', 'cyan')

  for (const { doc, apis } of results) {
    const implemented = apis.filter(a => a.implemented).length
    const tested = apis.filter(a => a.tested).length
    const withExamples = apis.filter(a => a.hasExamples).length

    log(`${doc}:`, 'bold')
    log(`  ├─ Implemented: ${implemented}/${apis.length} (${Math.round(implemented/apis.length*100)}%)`)
    log(`  ├─ Tested: ${tested}/${apis.length} (${Math.round(tested/apis.length*100)}%)`)
    log(`  └─ Examples: ${withExamples}/${apis.length} (${Math.round(withExamples/apis.length*100)}%)`)
  }

  // Warnings and recommendations
  log('\n⚠️  Recommendations\n', 'yellow')

  if (implementedAPIs < totalAPIs) {
    log(`   • ${totalAPIs - implementedAPIs} APIs are documented but not implemented.`, 'yellow')
    log(`   • Please update documentation or implement the APIs.`, 'yellow')
  }

  if (testedAPIs < totalAPIs * 0.9) {
    log(`   • ${totalAPIs - testedAPIs} APIs have no tests.`, 'yellow')
    log(`   • Minimum 90% test coverage is recommended.`, 'yellow')
  }

  if (exampleAPIs < totalAPIs * 0.5) {
    log(`   • ${totalAPIs - exampleAPIs} APIs have no examples.`, 'yellow')
    log(`   • Please add examples for main APIs in examples/ directory.`, 'yellow')
  }

  log('\n═══════════════════════════════════════════════════\n', 'cyan')

  // Exit code
  if (implementedAPIs === totalAPIs && testedAPIs > totalAPIs * 0.9) {
    log('✅ Verification complete: Documentation and code match!\n', 'green')
    process.exit(0)
  } else {
    log('⚠️  Verification complete: Some inconsistencies found.\n', 'yellow')
    process.exit(1)
  }
}

// Run script
if (require.main === module) {
  // Language can be specified via command line: node verify-docs.js en
  const docsLang = process.argv[2] || 'ko'
  verifyDocumentation(docsLang)
}

module.exports = { verifyDocumentation, extractAPIsFromDoc, checkImplementation }
