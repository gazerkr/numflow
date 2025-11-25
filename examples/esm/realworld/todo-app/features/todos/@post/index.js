import numflow from 'numflow'

// POST /todos - Create TODO
export default numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.title = req.body.title
  }
})
