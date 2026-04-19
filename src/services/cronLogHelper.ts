import { db } from '../db/drizzle';
import { cronLogs } from '../db/schema';
import { desc } from 'drizzle-orm';

export type CronLogInsert = {
  cronExpression: string;
  jobType: string;
  triggeredBy: string;
  status: 'success' | 'error';
  dispatched?: number;
  message?: string;
  errorMessage?: string;
};

export async function insertCronLog(data: CronLogInsert) {
  return db.insert(cronLogs).values(data).returning();
}

export async function getCronLogs(page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  return db
    .select()
    .from(cronLogs)
    .orderBy(desc(cronLogs.createdAt))
    .limit(limit)
    .offset(offset);
}
