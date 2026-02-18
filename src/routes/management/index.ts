import { Hono } from 'hono';
import { jwtAuth } from '../../middlewares/jwt-auth';

const management = new Hono<{ Bindings: CloudflareBindings }>();

management.use('/*',jwtAuth);
management.get('/apikeys', async (c) =>{
    return c.json({ message: 'This is a protected route for managing API keys' });
})

export default management;

