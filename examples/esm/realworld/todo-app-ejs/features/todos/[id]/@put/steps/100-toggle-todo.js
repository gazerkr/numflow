/**
 * Step 100: Toggle TODO completion status
 */

import db from '#db'

export default async (ctx, req, res) => {
  const { todoId } = ctx

  const todo = db.toggle(todoId)

  if (!todo) {
    throw new Error(`TODO not found (ID: ${todoId})`)
  }

  ctx.todo = todo
}
