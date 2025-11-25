export default async (ctx, req, res) => {
  const { email, name } = ctx.userData

  if (!email || !name) {
    res.status(400).json({ error: 'email and name are required' })
    return
  }

  ctx.email = email
  ctx.name = name
}
