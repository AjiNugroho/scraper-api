import { sql, desc, asc, eq } from 'drizzle-orm';
import { db } from '../db/drizzle';
import { ScraperRequestLog, tiktokScrapingRequests, tiktokHashTagListingVideos } from '../db/schema';

// ==================== INSTAGRAM ====================

export async function getInstagramOverview() {
  const [totalsResult, byIdentifierResult] = await Promise.all([
    db.select({ total: sql<number>`count(*)::int` }).from(ScraperRequestLog),
    db.select({
      identifier: sql<string>`(${ScraperRequestLog.requestDataMsg}->>'identifier')`,
      count: sql<number>`count(*)::int`,
    })
    .from(ScraperRequestLog)
    .groupBy(sql`(${ScraperRequestLog.requestDataMsg}->>'identifier')`)
    .orderBy(sql`count(*) DESC`),
  ]);

  const byIdentifier = byIdentifierResult.filter(r => r.identifier != null);
  return {
    total: totalsResult[0]?.total ?? 0,
    byIdentifier,
    identifiers: byIdentifier.map(r => r.identifier as string),
  };
}

export async function getInstagramTimeline(period: 'month' | 'week') {
  return db.select({
    period: sql<string>`DATE_TRUNC(${period}, ${ScraperRequestLog.createdAt})::text`,
    count: sql<number>`count(*)::int`,
  })
  .from(ScraperRequestLog)
  .groupBy(sql`DATE_TRUNC(${period}, ${ScraperRequestLog.createdAt})`)
  .orderBy(asc(sql`DATE_TRUNC(${period}, ${ScraperRequestLog.createdAt})`));
}

export async function getInstagramIdentifierTimeline(identifier: string, period: 'month' | 'week') {
  return db.select({
    period: sql<string>`DATE_TRUNC(${period}, ${ScraperRequestLog.createdAt})::text`,
    count: sql<number>`count(*)::int`,
  })
  .from(ScraperRequestLog)
  .where(sql`(${ScraperRequestLog.requestDataMsg}->>'identifier') = ${identifier}`)
  .groupBy(sql`DATE_TRUNC(${period}, ${ScraperRequestLog.createdAt})`)
  .orderBy(asc(sql`DATE_TRUNC(${period}, ${ScraperRequestLog.createdAt})`));
}

export async function getInstagramRequests(page: number, limit: number, identifier?: string) {
  const offset = (page - 1) * limit;
  const q = db.select({
    id: ScraperRequestLog.id,
    keyName: ScraperRequestLog.keyName,
    identifier: sql<string>`(${ScraperRequestLog.requestDataMsg}->>'identifier')`,
    dataSize: sql<number>`(${ScraperRequestLog.requestDataMsg}->>'data_size')::int`,
    webhookUrl: ScraperRequestLog.webhook_url,
    createdAt: ScraperRequestLog.createdAt,
  })
  .from(ScraperRequestLog)
  .orderBy(desc(ScraperRequestLog.createdAt))
  .limit(limit)
  .offset(offset);

  if (identifier) {
    return db.select({
      id: ScraperRequestLog.id,
      keyName: ScraperRequestLog.keyName,
      identifier: sql<string>`(${ScraperRequestLog.requestDataMsg}->>'identifier')`,
      dataSize: sql<number>`(${ScraperRequestLog.requestDataMsg}->>'data_size')::int`,
      webhookUrl: ScraperRequestLog.webhook_url,
      createdAt: ScraperRequestLog.createdAt,
    })
    .from(ScraperRequestLog)
    .where(sql`(${ScraperRequestLog.requestDataMsg}->>'identifier') = ${identifier}`)
    .orderBy(desc(ScraperRequestLog.createdAt))
    .limit(limit)
    .offset(offset);
  }

  return q;
}

// ==================== TIKTOK ====================

export async function getTiktokOverview() {
  const [reqResult, videoResult, hashtagResult] = await Promise.all([
    db.select({ total: sql<number>`count(*)::int` }).from(tiktokScrapingRequests),
    db.select({ total: sql<number>`count(*)::int` }).from(tiktokHashTagListingVideos),
    db.select({ total: sql<number>`count(distinct ${tiktokHashTagListingVideos.hashtag})::int` }).from(tiktokHashTagListingVideos),
  ]);

  return {
    totalRequests: reqResult[0]?.total ?? 0,
    totalVideos: videoResult[0]?.total ?? 0,
    totalHashtags: hashtagResult[0]?.total ?? 0,
  };
}

export async function getTiktokRequests(page: number, limit: number) {
  const offset = (page - 1) * limit;
  return db.select({
    id: tiktokScrapingRequests.id,
    identifier: tiktokScrapingRequests.identifier,
    keyName: tiktokScrapingRequests.keyName,
    createdAt: tiktokScrapingRequests.createdAt,
    videoCount: sql<number>`count(${tiktokHashTagListingVideos.id})::int`,
  })
  .from(tiktokScrapingRequests)
  .leftJoin(tiktokHashTagListingVideos, eq(tiktokHashTagListingVideos.requestId, tiktokScrapingRequests.id))
  .groupBy(tiktokScrapingRequests.id)
  .orderBy(desc(tiktokScrapingRequests.createdAt))
  .limit(limit)
  .offset(offset);
}

export async function getTiktokVideoTimeline(period: 'day' | 'week' | 'month') {
  return db.select({
    period: sql<string>`DATE_TRUNC(${period}, ${tiktokHashTagListingVideos.createdAt})::text`,
    hashtag: tiktokHashTagListingVideos.hashtag,
    count: sql<number>`count(*)::int`,
  })
  .from(tiktokHashTagListingVideos)
  .groupBy(
    sql`DATE_TRUNC(${period}, ${tiktokHashTagListingVideos.createdAt})`,
    tiktokHashTagListingVideos.hashtag,
  )
  .orderBy(asc(sql`DATE_TRUNC(${period}, ${tiktokHashTagListingVideos.createdAt})`));
}
