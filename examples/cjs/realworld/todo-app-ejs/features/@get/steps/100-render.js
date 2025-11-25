/**
 * Step 100: Render TODO list with EJS template
 */

module.exports = async (ctx, req, res) => {
  res.render('index', {
    todos: ctx.todos
  })
}
