export default async (ctx, req, res) => {
  if (!ctx.title || ctx.title.trim() === '') {
    res.status(400).json({ error: 'Title is required' })
    return
  }

  ctx.title = ctx.title.trim()
}
