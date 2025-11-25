/**
 * Step 200: Create new TODO
 */

import db from '#db'

export default async (ctx, req, res) => {
  const { validatedText } = ctx

  const newTodo = db.create({ text: validatedText })
  ctx.todo = newTodo
}
