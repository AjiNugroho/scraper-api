import { Hono } from 'hono';
import { jwtAuth } from '../../middlewares/jwt-auth';
import { AppEnv } from '../../../types/Env_types';
import { getCronLogs, insertCronLog } from '../../services/cronLogHelper';
import { dispatchScrapingJob, dispacthItemScrapingJob } from '../scraper_tiktok';
import {
  getInstagramOverview,
  getInstagramTimeline,
  getInstagramIdentifierTimeline,
  getInstagramRequests,
  getTiktokOverview,
  getTiktokRequests,
  getTiktokVideoTimeline,
} from '../../services/analyticsHelper';

const management = new Hono<{ Bindings: AppEnv }>();

management.use('/*', jwtAuth);

management.get('/apikeys', async (c) => {
  return c.json({ message: 'This is a protected route for managing API keys' });
});

management.get('/cron-logs', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '50')));
  const logs = await getCronLogs(page, limit);
  return c.json({ logs, page, limit });
});

management.post('/trigger/listing', async (c) => {
  const result = await dispatchScrapingJob(c.env);
  const isError = result.message.toLowerCase().startsWith('error');
  await insertCronLog({
    cronExpression: 'manual',
    jobType: 'listing',
    triggeredBy: 'manual',
    status: isError ? 'error' : 'success',
    dispatched: result.dispatched,
    message: isError ? undefined : result.message,
    errorMessage: isError ? result.message : undefined,
  });
  return c.json(result);
});

management.post('/trigger/item', async (c) => {
  const result = await dispacthItemScrapingJob(c.env);
  const isError = result.message.toLowerCase().startsWith('error');
  await insertCronLog({
    cronExpression: 'manual',
    jobType: 'item',
    triggeredBy: 'manual',
    status: isError ? 'error' : 'success',
    dispatched: result.dispatched,
    message: isError ? undefined : result.message,
    errorMessage: isError ? result.message : undefined,
  });
  return c.json(result);
});

// ===== Instagram Analytics =====

management.get('/analytics/instagram', async (c) => {
  const data = await getInstagramOverview();
  return c.json(data);
});

management.get('/analytics/instagram/timeline', async (c) => {
  const period = c.req.query('period') === 'week' ? 'week' : 'month';
  const data = await getInstagramTimeline(period);
  return c.json({ data, period });
});

management.get('/analytics/instagram/identifier', async (c) => {
  const identifier = c.req.query('identifier') || '';
  const period = c.req.query('period') === 'week' ? 'week' : 'month';
  if (!identifier) return c.json({ error: 'identifier is required' }, 400);
  const data = await getInstagramIdentifierTimeline(identifier, period);
  return c.json({ data, period, identifier });
});

management.get('/analytics/instagram/requests', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20')));
  const identifier = c.req.query('identifier') || undefined;
  const data = await getInstagramRequests(page, limit, identifier);
  return c.json({ data, page, limit });
});

// ===== TikTok Analytics =====

management.get('/analytics/tiktok', async (c) => {
  const data = await getTiktokOverview();
  return c.json(data);
});

management.get('/analytics/tiktok/requests', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20')));
  const data = await getTiktokRequests(page, limit);
  return c.json({ data, page, limit });
});

management.get('/analytics/tiktok/videos', async (c) => {
  const raw = c.req.query('period') || 'month';
  const period = (['day', 'week', 'month'].includes(raw) ? raw : 'month') as 'day' | 'week' | 'month';
  const data = await getTiktokVideoTimeline(period);
  return c.json({ data, period });
});

export default management;
