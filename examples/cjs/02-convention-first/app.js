const numflow = require('numflow')
const app = numflow()

// ⭐ Core of Convention over Configuration!
// Just create folder structure and all APIs are auto-registered!
app.registerFeatures('./features')

// Start server
if (require.main === module) {
  const PORT = process.env.PORT || 3000

  app.listen(PORT, () => {
    console.log(`\n✅ Server running on http://localhost:${PORT}\n`)
    console.log('📂 Auto-registered APIs:')
    console.log('   GET  /hello      ← features/hello/@get/')
    console.log('   GET  /users      ← features/users/@get/')
    console.log('   GET  /users/:id  ← features/users/[id]/@get/')
    console.log('\n⭐ Folder structure becomes your API!\n')
  })
}

module.exports = app
