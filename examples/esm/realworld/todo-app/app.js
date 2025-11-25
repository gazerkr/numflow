import numflow from 'numflow'

const app = numflow()

app.use(numflow.json())
app.registerFeatures('./features')

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  const PORT = process.env.PORT || 3000

  app.listen(PORT, () => {
    console.log(`\n✅ Server running on http://localhost:${PORT}\n`)
    console.log('🎯 Todo App API:')
    console.log('   GET    /todos      - List all todos')
    console.log('   POST   /todos      - Create todo')
    console.log('   DELETE /todos/:id  - Delete todo')
    console.log('\n')
  })
}

export default app
