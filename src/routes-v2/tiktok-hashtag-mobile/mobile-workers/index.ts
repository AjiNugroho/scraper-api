import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { eq } from 'drizzle-orm';
import { apiKeyAuth } from '../../../middlewares/api-key';
import { db } from '../../../db/drizzle';
import { workers } from '../../../db/schema';
import { rebalance } from '../../../services/rebalanceService';

type Variables = {
  apiKeyName: string;
}

const workersRouter = new Hono<{ Bindings: CloudflareBindings, Variables: Variables }>();

const createWorkerSchema = z.object({
  name: z.string().min(1),
});

workersRouter.use('/*', apiKeyAuth);

workersRouter.post('/',
  zValidator('json', createWorkerSchema),
  async (c) => {
    try {
      const { name } = c.req.valid('json');
      const result = await db.insert(workers).values({ name }).returning();
      await rebalance();
      return c.json({ success: true, worker: result[0] }, 201);
    } catch (error) {
      if (error instanceof Error && error.message.includes('unique')) {
        return c.json({ error: 'Worker name already exists' }, 409);
      }
      return c.json({ error: 'Failed to create worker' }, 500);
    }
  }
);

workersRouter.delete('/:name', async (c) => {
  try {
    const name = c.req.param('name');
    const result = await db.delete(workers).where(eq(workers.name, name)).returning();
    if (result.length === 0) {
      return c.json({ error: 'Worker not found' }, 404);
    }
    await rebalance();
    return c.json({ success: true });
  } catch (error) {
    return c.json({ error: 'Failed to delete worker' }, 500);
  }
});

export default workersRouter;
