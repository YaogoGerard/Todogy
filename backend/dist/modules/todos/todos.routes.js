import { Hono } from "hono";
import { authMiddleware } from "../auth/auth.middleware.js";
import { create, findAll, findById, update, remove } from "./todos.service.js";
const todosRoutes = new Hono();
todosRoutes.use('*', authMiddleware);
todosRoutes.get('/', async (c) => {
    const { userId } = c.get('jwtPayload');
    const todos = await findAll(userId);
    return c.json(todos);
});
todosRoutes.post('/', async (c) => {
    const { userId } = c.get('jwtPayload');
    const { title } = await c.req.json();
    const todo = await create(title, userId);
    return c.json(todo, 201);
});
todosRoutes.get('/:id', async (c) => {
    const { userId } = c.get('jwtPayload');
    const todo = await findById(c.req.param('id'), userId);
    return c.json(todo);
});
todosRoutes.put('/:id', async (c) => {
    const { userId } = c.get('jwtPayload');
    const body = await c.req.json();
    const todo = await update(c.req.param('id'), userId, body);
    return c.json(todo);
});
todosRoutes.delete('/:id', async (c) => {
    const { userId } = c.get('jwtPayload');
    await remove(c.req.param('id'), userId);
    return c.json({ message: 'Deleted' });
});
export default todosRoutes;
