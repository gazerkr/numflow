import numflow from 'numflow'

const app = numflow()

// Convention over Configuration!
// Just create folder structure and all APIs are auto-registered!
app.registerFeatures('./features')

// Start server
const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
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

export default app
