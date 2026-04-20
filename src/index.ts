import { Hono } from 'hono'
import { cors } from 'hono/cors';
import { auth } from './lib/auth';
import managementRoutes from './routes/management';
import scraperRoutes from './routes/scraper';
import webhookRoutes from './routes/webhooks';
import workerRoutes from './routes/worker';
import helper from './routes/helper';
import scraperTiktok, { dispacthItemScrapingJob, pushToBrightData, putAllListingToQueueWorker, putFromQueueWorkerToQueueAMQP } from './routes/scraper_tiktok';
import uiRoutes from './routes/ui';
import { AppEnv } from '../types/Env_types';
import { insertCronLog } from './services/cronLogHelper';

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(
	"/api/auth/*",
	cors({
		origin: ["http://localhost:3000", "https://api.fair-studio.com"],
		allowHeaders: ["Content-Type", "Authorization"],
		allowMethods: ["POST", "GET", "OPTIONS"],
		exposeHeaders: ["Content-Length"],
		maxAge: 600,
		credentials: true,
	}),
);
app.on(["POST", "GET"], "/api/auth/*", (c) => {
	return auth.handler(c.req.raw);
});

app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'Scraper API',
    version: '1.0.0',
  });
})

app.route('/management',managementRoutes)
app.route('/scrape',scraperRoutes)
app.route('/webhooks',webhookRoutes)
app.route('/worker',workerRoutes)
app.route('/helper',helper)
app.route('/scrape_tiktok',scraperTiktok)
app.route('/ui',uiRoutes)


// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default {
	  fetch: app.fetch,
	  async scheduled(
    	_event: ScheduledEvent,
		env: AppEnv,
		_ctx: ExecutionContext
		): Promise<void> {

		switch (_event.cron) {
			case "0 0 * * *":
			case "0 7 * * *":
			case "0 14 * * *": {
				console.log(`[cron] Scheduled listing trigger fired at ${new Date().toISOString()}`);
				const result = await putAllListingToQueueWorker(env);
				console.log(`[cron] ${result.message}`);
				const isError = result.message.toLowerCase().startsWith('error');
				await insertCronLog({
					cronExpression: _event.cron,
					jobType: 'listing',
					triggeredBy: 'cron',
					status: isError ? 'error' : 'success',
					dispatched: result.dispatched,
					message: isError ? undefined : result.message,
					errorMessage: isError ? result.message : undefined,
				});
				break;
			}
			case "0 14 * * 3": {
				console.log(`[cron] Scheduled item scraping trigger fired at ${new Date().toISOString()}`);
				const resultItem = await dispacthItemScrapingJob(env);
				console.log(`[cron] ${resultItem.message}`);
				const isItemError = resultItem.message.toLowerCase().startsWith('error');
				await insertCronLog({
					cronExpression: _event.cron,
					jobType: 'item',
					triggeredBy: 'cron',
					status: isItemError ? 'error' : 'success',
					dispatched: resultItem.dispatched,
					message: isItemError ? undefined : resultItem.message,
					errorMessage: isItemError ? resultItem.message : undefined,
				});
				break;
			}
			default:
				console.warn(`[cron] Unhandled cron schedule: ${_event.cron}`);
		}
	},
	async queue(batch: MessageBatch<any>, env: AppEnv, ctx: ExecutionContext): Promise<void> {

		switch (batch.queue) {
			case 'tiktok-listing-job': {

				console.log(`[queue tiktok_listing_job] Received ${batch.messages.length} messages from queue: ${batch.queue}`);
				
				for (const message of batch.messages) {
					try {
						const body = message.body;
						console.log(`[queue tiktok_listing_job] Processing message:`, body);
						
						await putFromQueueWorkerToQueueAMQP(body, env);
						
						message.ack(); // mark as successfully processed
					} catch (err) {
						console.error(`[queue tiktok_listing_job] Failed to process message:`, err);
						message.retry(); // requeue the message
					}
				}
				break;
			}
			case 'tiktok-items-job':{
				console.log(`[queue tiktok-items-job] Received ${batch.messages.length} messages from queue: ${batch.queue}`);
				
				for (const message of batch.messages) {
					try {
						const body = message.body;
						const webhookUrl = body.webhook_internal_scraper;

						console.log(`[queue tiktok-items-job] request_id: ${body.requestId} Processing message: ${body.video_urls.length} video URLs, webhook: ${webhookUrl}`);
						await pushToBrightData(body.video_urls, webhookUrl, env);
						message.ack(); // mark as successfully processed
					} catch (err) {
						console.error(`[queue tiktok-items-job] Failed to process message:`, err);
						message.retry(); // requeue the message
					}
				}
				break;
			}
			default:
				console.warn(`[queue] Received message from unhandled queue: ${batch.queue}`);
		}
	}
}
