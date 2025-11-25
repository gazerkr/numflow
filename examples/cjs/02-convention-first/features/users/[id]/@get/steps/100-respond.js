// Step using dynamic parameter
module.exports = async (ctx, req, res) => {
  const userId = req.params.id

  res.json({
    id: userId,
    name: `User ${userId}`
  })
}
