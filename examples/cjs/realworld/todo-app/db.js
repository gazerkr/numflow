// In-memory database
const todos = new Map()

let nextId = 1

module.exports = {
  // Find all TODOs
  findAll() {
    return Array.from(todos.values())
  },

  // Find TODO by ID
  findById(id) {
    return todos.get(id)
  },

  // Create TODO
  create(data) {
    const todo = {
      id: String(nextId++),
      title: data.title,
      completed: false,
      createdAt: new Date().toISOString()
    }

    todos.set(todo.id, todo)
    return todo
  },

  // Delete TODO
  delete(id) {
    return todos.delete(id)
  },

  // Total count
  count() {
    return todos.size
  }
}
