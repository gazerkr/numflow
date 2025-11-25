const numflow = require('numflow')

// DELETE /todos/:id - Delete TODO
module.exports = numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.todoId = req.params.id
  }
})
