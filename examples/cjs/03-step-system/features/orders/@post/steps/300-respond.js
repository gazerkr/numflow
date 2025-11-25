// Step 3: Final response
module.exports = async (ctx, req, res) => {
  console.log('✅ Step 3: Send response')

  // ⭐ Respond with data processed in previous Steps
  res.status(201).json({
    success: true,
    orderId: ctx.orderId,  // ← Saved in Step 2
    order: ctx.order       // ← Saved in Step 2
  })
}
