import numflow from 'numflow'

const app = numflow()

app.use(numflow.json())
app.registerFeatures('./features')

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  const PORT = process.env.PORT || 3000

  app.listen(PORT, () => {
    console.log(`\n✅ Server running on http://localhost:${PORT}\n`)
    console.log('🎯 AsyncTask Example:')
    console.log('   POST /users')
    console.log('\n   Steps complete → Send response → AsyncTasks run in background')
    console.log('\n📌 Client receives response immediately,')
    console.log('   Email/analytics processed in background!\n')
  })
}

export default app
