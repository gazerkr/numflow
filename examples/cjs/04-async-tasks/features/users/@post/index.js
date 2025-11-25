const numflow = require('numflow')

// ⭐ AsyncTask: Tasks executed in background after response
// POST /users
module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.userData = req.body
  }
})
