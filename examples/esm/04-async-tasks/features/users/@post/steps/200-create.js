export default async (ctx, req, res) => {
  const user = {
    id: Math.random().toString(36).substr(2, 9),
    email: ctx.email,
    name: ctx.name,
    createdAt: new Date().toISOString()
  }

  ctx.user = user
  ctx.userId = user.id
}
