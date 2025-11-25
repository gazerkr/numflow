import numflow from 'numflow'

// AsyncTask: Tasks executed in background after response
// POST /users
export default numflow.feature({
  contextInitializer: (ctx, req, res) => {
    ctx.userData = req.body
  }
})
