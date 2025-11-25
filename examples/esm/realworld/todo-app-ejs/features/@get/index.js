/**
 * GET / - TODO List Page
 *
 * Convention over Configuration:
 * - method: 'GET' <- Auto-inferred from folder name '@get'
 * - path: '/' <- Auto-inferred from folder structure
 * - steps: './steps' <- Automatic detection!
 */

import numflow from 'numflow'
import db from '#db'

export default numflow.feature({
  // Context initialization
  contextInitializer: (ctx, req, res) => {
    ctx.todos = db.findAll()
  },

  // Error handling with EJS template
  onError: async (error, ctx, req, res) => {
    console.error('Error loading TODO list:', error.message)
    res.status(500).render('error', {
      errorMessage: error.message
    })
  }
})
