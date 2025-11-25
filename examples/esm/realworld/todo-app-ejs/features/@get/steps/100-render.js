/**
 * Step 100: Render TODO list with EJS template
 */

export default async (ctx, req, res) => {
  res.render('index', {
    todos: ctx.todos
  })
}
