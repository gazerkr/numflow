module.exports = async (ctx, req, res) => {
  console.log(`💳 Payment attempt ${ctx.retryCount + 1}`)

  ctx.retryCount++

  // Simulation: 70% chance of network error
  const isNetworkError = Math.random() < 0.7

  if (isNetworkError) {
    throw new Error('NETWORK_ERROR')
  }

  // Success
  ctx.paymentId = Math.random().toString(36).substr(2, 9)
  console.log('✅ Payment successful!')
}
