const numflow = require('numflow')
const app = numflow()

// Basic route
app.get('/', (req, res) => {
  res.send('Hello World!')
})

// JSON response example
app.get('/json', (req, res) => {
  res.json({
    message: 'Hello Numflow!',
    framework: 'Numflow'
  })
})

// Start server
if (require.main === module) {
  const PORT = process.env.PORT || 3000
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

module.exports = app
