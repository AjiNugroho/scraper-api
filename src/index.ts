import { Hono } from 'hono'
import { cors } from 'hono/cors';
import { auth } from './lib/auth';
import managementRoutes from './routes/management';
import scraperRoutes from './routes/scraper';
import webhookRoutes from './routes/webhooks';
import workerRoutes from './routes/worker';
import helper from './routes/helper';
import scraperTiktok, { dispacthItemScrapingJob, dispatchScrapingJob } from './routes/scraper_tiktok';
import { AppEnv } from '../types/Env_types';

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(
	"/api/auth/*",
	cors({
		origin: "http://localhost:3000",
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
			case "0 23 * * *": 
			case "30 7 * * *":  
			case "0 15 * * *": 
				console.log(`[cron] Scheduled trigger fired at ${new Date().toISOString()}`);
				const result = await dispatchScrapingJob(env)
				console.log(`[cron] ${result.message}`);
				break;
			case "0 15 * * 3":
				console.log(`[cron] Scheduled item scraping trigger fired at ${new Date().toISOString()}`);
				const resultItem = await dispacthItemScrapingJob(env)
				console.log(`[cron] ${resultItem.message}`);
				break;
			default:
				console.warn(`[cron] Unhandled cron schedule: ${_event.cron}`);
		}
	}
}
