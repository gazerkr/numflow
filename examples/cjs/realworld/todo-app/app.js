const numflow = require('numflow')
const app = numflow()

// Middleware
app.use(numflow.json())
app.use(numflow.cors())

// Register features
app.registerFeatures('./features')

if (require.main === module) {
  const PORT = process.env.PORT || 3000

  app.listen(PORT, () => {
    console.log(`\n✅ TODO API running on http://localhost:${PORT}\n`)
    console.log('📚 Available APIs:')
    console.log('   GET    /todos      - List all TODOs')
    console.log('   POST   /todos      - Create TODO')
    console.log('   DELETE /todos/:id  - Delete TODO')
    console.log('\n🎯 Realworld Example - Complete TODO API')
    console.log('   All features applied: Convention + Step + Error Handling!\n')
  })
}

module.exports = app
