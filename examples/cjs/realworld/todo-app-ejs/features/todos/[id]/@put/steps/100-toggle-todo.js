/**
 * Step 100: Toggle TODO completion status
 */

const db = require('#db')

module.exports = async (ctx, req, res) => {
  const { todoId } = ctx

  const todo = db.toggle(todoId)

  if (!todo) {
    throw new Error(`TODO not found (ID: ${todoId})`)
  }

  ctx.todo = todo
}
