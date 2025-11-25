const numflow = require('numflow')

// ⭐ Convention over Configuration
// method: 'GET' ← Auto from @get folder!
// path: '/users' ← Auto from features/users/ folder structure!
// steps: './steps' ← steps/ folder auto-detected!
module.exports = numflow.feature({})
