const numflow = require('numflow')

// POST /todos - Create TODO
module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.title = req.body.title
  }
})
