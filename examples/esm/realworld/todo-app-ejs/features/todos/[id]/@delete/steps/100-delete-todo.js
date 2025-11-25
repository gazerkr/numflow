/**
 * Step 100: Delete TODO
 */

import db from '#db'

export default async (ctx, req, res) => {
  const { todoId } = ctx

  const deletedTodo = db.delete(todoId)

  if (!deletedTodo) {
    throw new Error(`TODO not found (ID: ${todoId})`)
  }

  ctx.deletedTodo = deletedTodo
}
