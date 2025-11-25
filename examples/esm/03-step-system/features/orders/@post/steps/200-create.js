// Step 2: Create order (using Context from previous Step)
export default async (ctx, req, res) => {
  console.log('🛒 Step 2: Create order')

  // Use validated data from previous Step
  const order = {
    id: Math.random().toString(36).substr(2, 9),
    productId: ctx.productId,  // ← Saved in Step 1
    quantity: ctx.quantity,    // ← Saved in Step 1
    status: 'created',
    createdAt: ctx.timestamp   // ← Saved in contextInitializer
  }

  // Save result to Context (share with next Step)
  ctx.order = order
  ctx.orderId = order.id
}
