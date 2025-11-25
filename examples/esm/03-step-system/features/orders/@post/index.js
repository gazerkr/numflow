import numflow from 'numflow'

// Step System: Break complex logic into small steps
// POST /orders
export default numflow.feature({
  // Initialize Context
  contextInitializer: (ctx, req, res) => {
    ctx.orderData = req.body
    ctx.timestamp = new Date().toISOString()
  }
})
