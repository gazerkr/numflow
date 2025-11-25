/**
 * In-memory TODO Database
 *
 * A simple in-memory storage for TODO items.
 * In production, use a real database!
 */

const todos = [
  { id: '1', text: 'Learn Numflow Framework', completed: false, createdAt: new Date().toISOString() },
  { id: '2', text: 'Master Feature-First Pattern', completed: true, createdAt: new Date().toISOString() },
  { id: '3', text: 'Build TODO App with EJS', completed: false, createdAt: new Date().toISOString() },
]

let nextId = 4

const db = {
  findAll() {
    return [...todos]
  },

  findById(id) {
    return todos.find(todo => todo.id === id) || null
  },

  create(data) {
    const todo = {
      id: String(nextId++),
      text: data.text,
      completed: false,
      createdAt: new Date().toISOString()
    }
    todos.push(todo)
    return todo
  },

  update(id, data) {
    const todo = todos.find(t => t.id === id)
    if (!todo) return null

    Object.assign(todo, data)
    return todo
  },

  toggle(id) {
    const todo = todos.find(t => t.id === id)
    if (!todo) return null

    todo.completed = !todo.completed
    return todo
  },

  delete(id) {
    const index = todos.findIndex(t => t.id === id)
    if (index === -1) return null

    const [deleted] = todos.splice(index, 1)
    return deleted
  },

  count() {
    return todos.length
  },

  countCompleted() {
    return todos.filter(t => t.completed).length
  }
}

module.exports = db
