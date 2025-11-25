const db = require('#db')

module.exports = async (ctx, req, res) => {
  ctx.todos = db.findAll()
  ctx.count = db.count()
}
