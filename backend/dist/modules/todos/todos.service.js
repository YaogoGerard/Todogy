import { Todo } from './todos.model.js';
import { notFound } from '../../shared/http-error.js';
export async function create(title, userId, completed = false) {
    return Todo.create({ title, userId, completed });
}
export async function findAll(userId) {
    return Todo.find({ userId }).sort({ createdAt: -1 });
}
export async function findById(id, userId) {
    const todo = await Todo.findOne({ _id: id, userId });
    if (!todo)
        throw notFound('Todo not found');
    return todo;
}
export async function update(id, userId, data) {
    const todo = await Todo.findOneAndUpdate({ _id: id, userId }, { $set: data }, { returnDocument: 'after' });
    if (!todo)
        throw notFound('Todo not found');
    return todo;
}
export async function remove(id, userId) {
    const todo = await Todo.findOneAndDelete({ _id: id, userId });
    if (!todo)
        throw notFound('Todo not found');
    return todo;
}
