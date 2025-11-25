module.exports = async (ctx, req, res) => {
  console.log('✅ Send response (client receives immediately)')

  res.status(201).json({
    success: true,
    userId: ctx.userId,
    user: ctx.user
  })

  // ⭐ Response complete here!
  // AsyncTasks will run in background after this.
}
