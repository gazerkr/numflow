/**
 * Step 900: Send response
 */

export default async (ctx, req, res) => {
  res.status(201).json({
    success: true,
    todo: ctx.todo
  })
}
