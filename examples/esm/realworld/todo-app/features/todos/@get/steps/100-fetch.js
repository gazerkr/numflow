import db from '#db'

export default async (ctx, req, res) => {
  ctx.todos = db.findAll()
  ctx.count = db.count()
}
