export default async (ctx, req, res) => {
  res.json({
    success: true,
    paymentId: ctx.paymentId,
    attempts: ctx.retryCount
  })
}
