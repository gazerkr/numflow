// In-memory database
const todos = new Map()

let nextId = 1

export function findAll() {
  return Array.from(todos.values())
}

export function findById(id) {
  return todos.get(id)
}

export function create(data) {
  const todo = {
    id: String(nextId++),
    title: data.title,
    completed: false,
    createdAt: new Date().toISOString()
  }

  todos.set(todo.id, todo)
  return todo
}

export function remove(id) {
  return todos.delete(id)
}

export function count() {
  return todos.size
}

export default {
  findAll,
  findById,
  create,
  delete: remove,
  count
}
