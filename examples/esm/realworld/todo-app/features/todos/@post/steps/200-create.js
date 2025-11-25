import db from '#db'

export default async (ctx, req, res) => {
  ctx.todo = db.create({ title: ctx.title })
}
