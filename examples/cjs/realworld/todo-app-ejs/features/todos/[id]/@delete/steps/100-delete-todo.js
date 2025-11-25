/**
 * Step 100: Delete TODO
 */

const db = require('#db')

module.exports = async (ctx, req, res) => {
  const { todoId } = ctx

  const deletedTodo = db.delete(todoId)

  if (!deletedTodo) {
    throw new Error(`TODO not found (ID: ${todoId})`)
  }

  ctx.deletedTodo = deletedTodo
}
