/**
 * Step 900: Send response
 */

module.exports = async (ctx, req, res) => {
  res.status(201).json({
    success: true,
    todo: ctx.todo
  })
}
