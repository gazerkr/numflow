/**
 * Async Task Scheduler Debug Mode Tests
 *
 * NOTE: This test verifies logging functionality.
 * To enable logging, we set NODE_ENV='development' and reload module.
 */

// Set environment variable BEFORE module loading
const originalEnv = process.env.NODE_ENV
process.env.NODE_ENV = 'development'

// Clear module cache and reload
const schedulerPath = require.resolve('../src/feature/async-task-scheduler')
delete require.cache[schedulerPath]
const { AsyncTaskScheduler } = require('../src/feature/async-task-scheduler')

import { AsyncTaskInfo, Context } from '../src/feature/types'

describe('Async Task Scheduler Debug Mode', () => {
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  afterAll(() => {
    // Restore environment
    process.env.NODE_ENV = originalEnv

    // Reinitialize module cache
    delete require.cache[schedulerPath]
  })

  it('should include task path in error log when async task fails', async () => {
    const tasks: AsyncTaskInfo[] = [
      {
        name: 'send-email',
        path: '/features/orders/@post/async-tasks/send-email.js',
        fn: async (_ctx) => {
          throw new Error('SMTP connection failed')
        },
      },
    ]

    const ctx: Context = {}
    const scheduler = new AsyncTaskScheduler(tasks, ctx)
    scheduler.schedule()

    // Wait for async execution
    await new Promise(resolve => setTimeout(resolve, 50))

    // Error log should include both task.name and task.path
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('send-email')
    )
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('/features/orders/@post/async-tasks/send-email.js')
    )
  })
})
