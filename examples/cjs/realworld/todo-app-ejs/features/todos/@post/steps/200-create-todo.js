/**
 * Step 200: Create new TODO
 */

const db = require('#db')

module.exports = async (ctx, req, res) => {
  const { validatedText } = ctx

  const newTodo = db.create({ text: validatedText })
  ctx.todo = newTodo
}
