// Step 1: Validate input data
export default async (ctx, req, res) => {
  console.log('📝 Step 1: Validation')

  const { productId, quantity } = ctx.orderData

  if (!productId) {
    res.status(400).json({ error: 'productId is required' })
    return  // ← Early return (skip next Steps)
  }

  if (!quantity || quantity < 1) {
    res.status(400).json({ error: 'quantity must be >= 1' })
    return
  }

  // Validation success → Save to Context
  ctx.productId = productId
  ctx.quantity = quantity
  ctx.isValid = true
}
