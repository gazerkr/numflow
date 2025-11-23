/**
 * Benchmark execution utilities
 */

const autocannon = require('autocannon')
const { spawn } = require('child_process')
const { promisify } = require('util')

const sleep = promisify(setTimeout)

/**
 * Start server
 * @param {Object} config - Server configuration { script, port, name }
 * @returns {Promise<ChildProcess>} Server process
 */
function startServer(config) {
  return new Promise((resolve, reject) => {
    const server = spawn('node', [config.script], {
      env: { ...process.env, PORT: config.port },
      stdio: 'pipe',
    })

    let resolved = false

    // Timeout after 5 seconds
    const timeout = setTimeout(() => {
      if (!resolved) {
        console.error(`${config.name} startup timeout (5s)`)
        resolve(server) // Still resolve to continue benchmark
      }
    }, 5000)

    server.stdout.on('data', (data) => {
      const output = data.toString()
      console.log(`[${config.name} stdout]:`, output.trim())

      if (output.includes('running on port')) {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          resolve(server)
        }
      }
    })

    server.stderr.on('data', (data) => {
      console.error(`[${config.name} stderr]:`, data.toString().trim())
    })

    server.on('error', (error) => {
      console.error(`${config.name} spawn error:`, error)
      if (!resolved) {
        resolved = true
        clearTimeout(timeout)
        reject(error)
      }
    })

    server.on('exit', (code) => {
      if (!resolved) {
        resolved = true
        clearTimeout(timeout)
        console.error(`${config.name} exited with code ${code} before ready`)
        reject(new Error(`Server exited with code ${code}`))
      }
    })
  })
}

/**
 * Run benchmark
 * @param {string} url - Target URL for benchmark
 * @param {Object} scenario - Scenario configuration
 * @param {string} serverName - Server name
 * @param {Object} options - autocannon options (connections, duration)
 * @returns {Promise<Object>} Benchmark results
 */
async function runBenchmark(url, scenario, serverName, options = {}) {
  const config = {
    url,
    method: scenario.method || 'GET',
    connections: options.connections || 100,
    duration: options.duration || 10,
  }

  if (scenario.body) {
    config.body = JSON.stringify(scenario.body)
    config.headers = {
      'Content-Type': 'application/json',
    }
  }

  const result = await autocannon(config)

  return {
    scenario: scenario.name,
    server: serverName,
    requestsPerSec: result.requests.mean,
    latency: result.latency.mean,
    throughput: result.throughput.mean,
    errors: result.errors,
  }
}

module.exports = {
  startServer,
  runBenchmark,
  sleep,
}
