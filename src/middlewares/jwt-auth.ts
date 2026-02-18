import { Context, Next } from 'hono';
import { auth } from '../lib/auth';

export async function jwtAuth(c: Context, next: Next) {
    try {
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });
  
      if (!session) {
        return c.json({ error: 'Unauthorized' }, 403);
      }
  
      c.set('user', session.user);
      c.set('session', session);
  
      await next();
    } catch (error) {
      return c.json({ error: 'Authentication failed' }, 401);
    }
  }