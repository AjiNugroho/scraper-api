import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { apiKeyAuth } from '../../../middlewares/api-key';
import { db } from '../../../db/drizzle';
import { tiktokHashtagVideoResult } from '../../../db/schema';

type Variables = {
  apiKeyName: string;
}

const results = new Hono<{ Bindings: CloudflareBindings, Variables: Variables }>();

const inputSchema = z.object({
  worker_name: z.string().min(1),
  video_urls: z.array(z.url()).min(1),
});

results.use('/*', apiKeyAuth);

results.post('/',
  zValidator('json', inputSchema),
  async (c) => {
    try {
      const { worker_name, video_urls } = c.req.valid('json');

      await db.insert(tiktokHashtagVideoResult).values(
        video_urls.map((url) => ({
          workerName: worker_name,
          videoUrl: url,
        }))
      );

      return c.json({ success: true, saved: video_urls.length }, 201);
    } catch (error) {
      return c.json({ error: 'Failed to save results' }, 500);
    }
  }
);

export default results;
