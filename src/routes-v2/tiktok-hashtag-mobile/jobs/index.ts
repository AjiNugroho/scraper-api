import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { apiKeyAuth } from '../../../middlewares/api-key';
import { db } from '../../../db/drizzle';
import { tiktokHashtagRequests, jobHashtag, workerHashtagTask, workers } from '../../../db/schema';
import { rebalance } from '../../../services/rebalanceService';
import { eq } from 'drizzle-orm';

type Variables = {
  apiKeyName: string;
}

const jobs = new Hono<{ Bindings: CloudflareBindings, Variables: Variables }>();

const itemSchema = z.object({
  identifier: z.string().min(1),
  date_start: z.string().optional(),
  date_end: z.string().optional(),
  data_size: z.number().int().optional(),
});

const extrasSchema = z.looseObject({
  listen_group_id: z.number().int(),
  request_data_id: z.number().int(),
});

const inputSchema = z.object({
  webhook_url: z.url().optional(),
  extras: extrasSchema,
  data: z.array(itemSchema).min(1).max(50),
});

jobs.use('/*', apiKeyAuth);

jobs.post('/',
  zValidator('json', inputSchema),
  async (c) => {
    try {
      const body = c.req.valid('json');
      const { extras, data, webhook_url } = body;

      await db
        .insert(tiktokHashtagRequests)
        .values(
          data.map((item) => ({
            listenGroupId: extras.listen_group_id,
            requestDataId: extras.request_data_id,
            hashtag: item.identifier,
            webhookUrl: webhook_url ?? null,
            extras,
          }))
        )
        .onConflictDoNothing();

      await db
        .insert(jobHashtag)
        .values(data.map((item) => ({ hashtag: item.identifier })))
        .onConflictDoNothing();

      await rebalance();

      return c.json({ success: true }, 201);
    } catch (error) {
      return c.json({ error: 'Failed to create job' }, 500);
    }
  }
);

jobs.get('/hashtags', async (c) => {
  const workerName = c.req.query('worker_name');
  if (!workerName) {
    return c.json({ error: 'worker_name is required' }, 400);
  }

  const rows = await db
    .select({ hashtag: jobHashtag.hashtag })
    .from(workerHashtagTask)
    .innerJoin(jobHashtag, eq(workerHashtagTask.hashtagId, jobHashtag.id))
    .innerJoin(workers, eq(workerHashtagTask.workerId, workers.id))
    .where(eq(workers.name, workerName));

  return c.json(rows.map((r) => r.hashtag));
});

export default jobs;
