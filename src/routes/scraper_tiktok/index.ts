import { Context, Hono } from 'hono';
import {z} from 'zod'
import { zValidator } from '@hono/zod-validator'
import { apiKeyAuth } from '../../middlewares/api-key';
import { deleteTiktokScrapingRequestById, getTiktokScrapedVideosListAll, getTiktokScrapingRequestList, insertTikTokScrapingRequest } from '../../services/tiktokScraperDBHelper';
import { sendToQueue } from '../../services/tiktokScraperQueueHelper';
import { scrapeVideosByUrl } from '../../services/brightDataScraperHelper';
import { AppEnv } from '../../../types/Env_types';

const inputSchema = z.object({
    hashtag: z.string().min(1),
})

type Variables ={
  apiKeyName:string;
}

const scraperTiktok = new Hono<{ Bindings: AppEnv,Variables:Variables }>();

scraperTiktok.use('/*',apiKeyAuth);

// insert into tiktokScrapingRequests

scraperTiktok.post('/hashtag',
zValidator('json', inputSchema),
async (c) => {
  try {
    const {hashtag} = c.req.valid('json');
    const insertResp = await insertTikTokScrapingRequest(hashtag);
    return c.json({ 
        status: 'ok', 
        message: 'Hashtag scraping request received',
        data: insertResp
    });
  } catch (error) {
    return c.json({ error: 'Invalid input' }, 400);
  }
})

// get all listed hashtag scraping request
scraperTiktok.get('/hashtag', async(c)=>{
    const requestList = await getTiktokScrapingRequestList();
    return c.json({ 
        status: 'ok', 
        message: 'Hashtag scraping request list retrieved',
        data: requestList
    });
})

// delete a listed hashtag scraping request by name
scraperTiktok.delete('/hashtag/:id', async(c)=>{
    const { id } = c.req.param();
    const deleteResult = await deleteTiktokScrapingRequestById(id);
    return c.json({
        status: 'ok',
        message: deleteResult.message
    });
})


scraperTiktok.post('/trigger', async(c)=>{
    const dispatchResult = await dispatchScrapingJob(c.env);
    return c.json(dispatchResult);
})

scraperTiktok.post('/trigger-item-scraping', async(c)=>{
  const dispatchResult = await dispacthItemScrapingJob(c.env);
  return c.json(dispatchResult);
})



export const dispatchScrapingJob = async(env: AppEnv) =>{
    // get tiktok scraping request list
    const requestList = await getTiktokScrapingRequestList();

    if(requestList.length === 0){
        return { dispatched: 0, message: "No scraping requests found" };
    }

    // send to queue incrementally by 10
    const batchSize = 10;
    let dispatchedCount = 0;

    for(let i=0; i<requestList.length; i+=batchSize){
        const batch = requestList.slice(i, i+batchSize);
        await Promise.all(batch.map(request => sendToQueue(env, { hashtag: request.hashtag })));
        dispatchedCount += batch.length;
    }

    return { dispatched: dispatchedCount, message: `Dispatched ${dispatchedCount} scraping jobs to the queue` };
}


export const dispacthItemScrapingJob = async(env: AppEnv) => {
  // get all tiktok scraped url list
  const urlList = await getTiktokScrapedVideosListAll();
  
  if(urlList.length === 0){
      return { dispatched: 0, message: "No scraped videos urls found" };
  }

  const batchSize = 50;
  let dispatchedCount = 0;

  for(let i=0; i<urlList.length; i+=batchSize){
      const batch = urlList.slice(i, i+batchSize);
      const urls = batch.map(item => item.url_string);
      await scrapeVideosByUrl(env, urls);
      dispatchedCount += batch.length;
  }

  return { dispatched: dispatchedCount, message: `Dispatched ${dispatchedCount} item scraping jobs to brightdata` };
}

export default scraperTiktok;