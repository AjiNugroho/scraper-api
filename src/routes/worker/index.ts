import { Hono } from 'hono';
import {z} from 'zod'
import { apiKeyAuth } from '../../middlewares/api-key';
import { zValidator } from '@hono/zod-validator';
import { logWorkerRequest } from '../../services/transactionLogger';

const worker = new Hono<{ Bindings: CloudflareBindings }>();

const inputSchema=z.object({
    worker:z.string(),
    task:z.string(),
    target_url:z.url(),
    requested_max_item:z.number().min(1),
    scraper_list_collected_count:z.number(),
    chunk_start_index:z.number(),
    chunk_size:z.number(),
    post_urls:z.array(
        z.object({
            url:z.url(),
        })
    ),
    snapshot_id:z.string().optional(),
    webhook_endpoint:z.url().optional(),
})

worker.use('/*',apiKeyAuth);

worker.get('/testreport', (c) => {
    return c.json({ 
        status: 'ok', 
        message: 'Worker report endpoint is working',
    });
})

worker.post('/report',
    zValidator('json',inputSchema),
    async (c) => {
        try{ 
            const messages = c.req.valid('json');
            await logWorkerRequest(messages);

            return c.json({ success: true }, 200);
        }
        catch(error){
            console.error('Error worker report :', error);
            return c.json({ 
                error: 'Worker report failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            }, 500);
        }
    }
)

export default worker;