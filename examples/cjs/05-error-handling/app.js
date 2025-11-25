const numflow = require('numflow')
const app = numflow()

app.use(numflow.json())
app.registerFeatures('./features')

// ⭐ Global Error Handler
app.onError((err, req, res) => {
  console.error('🔴 Global Error Handler:', err.message)

  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal Server Error' })
  }
})

if (require.main === module) {
  const PORT = process.env.PORT || 3000

  app.listen(PORT, () => {
    console.log(`\n✅ Server running on http://localhost:${PORT}\n`)
    console.log('🎯 Error Handling Example:')
    console.log('   POST /payments')
    console.log('\n   Feature.onError() → Retry → Global Error Handler')
    console.log('\n📌 70% chance of network error')
    console.log('   Auto-retry up to 3 times!\n')
  })
}

module.exports = app
