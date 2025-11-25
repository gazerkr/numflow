import numflow from 'numflow'

// DELETE /todos/:id - Delete TODO
export default numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.todoId = req.params.id
  }
})
