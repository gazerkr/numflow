const numflow = require('numflow')

// ⭐ Dynamic parameters also use Convention!
// method: 'GET' ← Auto from @get folder!
// path: '/users/:id' ← [id] folder auto-converts to :id!
// steps: './steps' ← steps/ folder auto-detected!
module.exports = numflow.feature({})
