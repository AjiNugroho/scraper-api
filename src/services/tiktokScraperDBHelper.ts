import { eq, sql } from "drizzle-orm";
import { db } from "../db/drizzle"
import { tiktokHashTagListingVideos, tiktokScrapingRequests } from "../db/schema"

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


export const getTiktokListingVideosWithWebhook = async () => {
    const result = await db
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
            ORDER BY request_id, video_url, created_at DESC
        ) AS v
        `,
        sql`v.request_id = ${tiktokScrapingRequests.id}`
    )
    .groupBy(tiktokScrapingRequests.id);
    return result;
}
