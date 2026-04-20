import { eq, sql } from "drizzle-orm";
import { db } from "../db/drizzle"
import { itemJobLastRun, tiktokHashTagListingVideos, tiktokScrapingRequests } from "../db/schema"

interface ScraperRequestLog {
    keyName: string;
    scraper:string;
    identifier:string;
    webhook_url:string;
    requestDataMsg:string;
    extras?:string;
    request_group_id?:string;
    request_data_id?:string;
}

export const insertTikTokScrapingRequest = async (req: ScraperRequestLog) => {

    const response = await db.insert(tiktokScrapingRequests).values(req)

    return response;
}

export const getTiktokScrapingRequestList = async () => {

    const response = await db.select({
        id:tiktokScrapingRequests.id,
        hashtag:tiktokScrapingRequests.identifier,

    }).from(tiktokScrapingRequests);

    return response;
}

export const getTiktokScrapingRequestByHashtag = async (hashtag: string) => {

    const response = await db.select(
        {
            id:tiktokScrapingRequests.id,
            hashtag:tiktokScrapingRequests.identifier,
        }
    ).from(tiktokScrapingRequests).where(
        eq(tiktokScrapingRequests.identifier, hashtag)
    );

    return response;
}

export const getTiktokScrapingRequestByID = async (id: string) => {

    const [response] = await db.select().from(tiktokScrapingRequests).where(
        sql`${tiktokScrapingRequests.id} = ${id}`
    );

    return response;
}

export const getTiktokListingVideosAll = async () => {

    const response = await db.select().from(tiktokHashTagListingVideos);
    return response;
}

export const updateItemJobLastRunByNow = async () => {
    // This function updates the last run time of the item job to the current time. It assumes there is only one record in the item_job_last_run table.
    const now = new Date();
    const existingRecord = await db.select().from(itemJobLastRun).limit(1);

    if (existingRecord.length > 0) {
        // Update the existing record
        await db.update(itemJobLastRun).set({ lastRunAt: now }).where(eq(itemJobLastRun.id, existingRecord[0].id));
    } else {
        // Insert a new record if none exists
        await db.insert(itemJobLastRun).values({ lastRunAt: now });
    }
}

export const getItemJobLastRun = async () => {
    const [record] = await db.select().from(itemJobLastRun).limit(1);
    if (!record) {
        // update last run to now
        await updateItemJobLastRunByNow();
        return new Date(); // return current time if no record exists
    }else{
        return record.lastRunAt;
    }
}

export const getTiktokListingVideosWithWebhook = async () => {

    const lastRunDate = await getItemJobLastRun();

    const query = db
    .select({
        id: tiktokScrapingRequests.id,
        videos: sql<{ url: string }[]>`
        COALESCE(
            json_agg(
            json_build_object('url', v.video_url)
            ORDER BY v.created_at DESC
            ),
            '[]'
        )
        `,
    })
    .from(tiktokScrapingRequests)
    .leftJoin(
        sql`
        (
            SELECT DISTINCT ON (request_id, video_url)
            request_id,
            video_url,
            created_at
            FROM ${tiktokHashTagListingVideos}
            WHERE created_at > ${lastRunDate.toDateString()}
            ORDER BY request_id, video_url, created_at DESC
        ) AS v
        `,
        sql`v.request_id = ${tiktokScrapingRequests.id}`
    )
    .groupBy(tiktokScrapingRequests.id);
    // console.log(query.toSQL().sql); // Log the generated SQL query for debugging
    return await query;
}
