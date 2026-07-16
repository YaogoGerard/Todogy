import { Todo } from "./todos.model.js";
export async function create(title, userId) {
    const todo = await Todo.create({ title, userId });
    return todo;
}
export async function findAll(userId) {
    return await Todo.find({ userId }).sort({ createdAt: -1 });
}
export async function findById(id, userId) {
    const todo = await Todo.findOne({ _id: id, userId });
    if (!todo)
        throw new Error('Todo not found');
    return todo;
}
export async function update(id, userId, data) {
    const todo = await Todo.findOneAndUpdate({ _id: id, userId }, { $set: data }, { returnDocument: 'after' });
    if (!todo)
        throw new Error('Todo not found');
    return todo;
}
export async function remove(id, userId) {
    const todo = await Todo.findOneAndDelete({ _id: id, userId });
    if (!todo)
        throw new Error('Todo not found');
    return todo;
}
