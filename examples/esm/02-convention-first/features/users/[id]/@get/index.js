import numflow from 'numflow'

// Dynamic parameters also use Convention!
// method: 'GET' ← Auto from @get folder!
// path: '/users/:id' ← [id] folder auto-converts to :id!
// steps: './steps' ← steps/ folder auto-detected!
export default numflow.feature({})
