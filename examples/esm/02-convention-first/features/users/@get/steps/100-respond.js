// Simple response Step
export default async (ctx, req, res) => {
  const users = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
    { id: '3', name: 'Charlie' }
  ]

  res.json({ users })
}
