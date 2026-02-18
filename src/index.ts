import { Hono } from 'hono'
import { cors } from 'hono/cors';
import { auth } from './lib/auth';
import managementRoutes from './routes/management';
import scraperRoutes from './routes/scraper';
import webhookRoutes from './routes/webhooks';
import workerRoutes from './routes/worker';

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


// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app
