/**
 * Step 900: Send response
 */

export default async (ctx, req, res) => {
  res.status(200).json({
    success: true,
    deletedTodo: ctx.deletedTodo
  })
}
