const numflow = require('numflow')

// ⭐ Step System: Break complex logic into small steps
// POST /orders
module.exports = numflow.feature({
  // Initialize Context
  contextInitializer: (ctx, req, res) => {
    ctx.orderData = req.body
    ctx.timestamp = new Date().toISOString()
  }
})
