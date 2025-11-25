import numflow from 'numflow'

const app = numflow()

// Enable body parser (JSON parsing)
app.use(numflow.json())

// Register features
app.registerFeatures('./features')

const isMain = import.meta.url === `file://${process.argv[1]}`
if (isMain) {
  const PORT = process.env.PORT || 3000

  app.listen(PORT, () => {
    console.log(`\n✅ Server running on http://localhost:${PORT}\n`)
    console.log('🎯 Step System Example:')
    console.log('   POST /orders')
    console.log('\n   Step 1: Validate → Step 2: Create → Step 3: Respond')
    console.log('\n📌 Break complex logic into small steps!')
    console.log('   Each Step shares Context.\n')
  })
}

export default app
