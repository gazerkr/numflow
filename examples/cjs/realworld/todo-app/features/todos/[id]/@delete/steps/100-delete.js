const db = require('#db')

module.exports = async (ctx, req, res) => {
  const deleted = db.delete(ctx.todoId)

  if (!deleted) {
    res.status(404).json({ error: 'TODO not found' })
    return
  }

  ctx.deleted = true
}
