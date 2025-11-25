module.exports = async (ctx, req, res) => {
  res.json({
    todos: ctx.todos,
    count: ctx.count
  })
}
