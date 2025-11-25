// Step using dynamic parameter
export default async (ctx, req, res) => {
  const userId = req.params.id

  res.json({
    id: userId,
    name: `User ${userId}`
  })
}
