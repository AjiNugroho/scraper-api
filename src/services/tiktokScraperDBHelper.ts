import { eq } from "drizzle-orm";
import { db } from "../db/drizzle"
import { tiktokScrapedVideos, tiktokScrapingRequests } from "../db/schema"

export const insertTikTokScrapingRequest = async (hashtag: string) => {

    const [response] = await db.insert(tiktokScrapingRequests).values({
        hashtag
    }).returning()

    return response;
}

export const getTiktokScrapingRequestList = async () => {

    const response = await db.select().from(tiktokScrapingRequests);

    return response;
}

export const deleteTiktokScrapingRequestById = async (id: string) => {

    await db.delete(tiktokScrapingRequests).where(
        eq(
        tiktokScrapingRequests.id,(id)
    ));

    return { status: "ok", message: `Hashtag scraping request with ID ${id} has been deleted` };
}

export const getTiktokScrapedVideosListAll = async () => {
    
    const response = await db.select().from(tiktokScrapedVideos);
    return response;
}