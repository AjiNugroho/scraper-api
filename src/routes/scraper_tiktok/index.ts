import { Hono } from 'hono';
import {z} from 'zod'
import { zValidator } from '@hono/zod-validator'
import { apiKeyAuth } from '../../middlewares/api-key';
import { getTiktokListingVideosWithWebhook, getTiktokScrapingRequestByHashtag, getTiktokScrapingRequestList, insertTikTokScrapingRequest, updateItemJobLastRunByNow } from '../../services/tiktokScraperDBHelper';
import { sendToQueue } from '../../services/tiktokScraperQueueHelper';
import { scrapeVideosByUrl } from '../../services/brightDataScraperHelper';
import { AppEnv } from '../../../types/Env_types';

type Variables ={
  apiKeyName:string;
}

const itemSchema =z.object({
    identifier:z.string(),
    date_start:z.string().optional(),
    date_end:z.string().optional(),
    data_size:z.number().optional(),
});

const inputSchema = z.object({
  webhook_url:z.url().optional(),
  extras:z.record(z.string(), z.any()).optional(),
  data:z.array(itemSchema).min(1).max(50),
})

const hashtagSpecificInputSchema = z.object({
  hashtag:z.string()
})

const scraperTiktok = new Hono<{ Bindings: AppEnv,Variables:Variables }>();

scraperTiktok.use('/*',apiKeyAuth);

scraperTiktok.get('/get-job', (c) => {
  return c.json(['wardah']);
});

// insert into tiktokScrapingRequests

scraperTiktok.post('/hashtag',
zValidator('json', inputSchema),
async (c) => {
  try {
    const messages = c.req.valid('json');

    const webhook_input = messages.webhook_url;
    const messages_input = messages.data;
    const extras_input = messages.extras || {};

    const request_group_id = extras_input.request_group_id || '';
    const request_data_id = extras_input.request_data_id || '';

    for (const msg of messages_input) {

        
        const requestData={
            keyName:c.get('apiKeyName') || 'unknown',
            scraper:'tiktok_hashtag',
            identifier:msg.identifier,
            webhook_url:webhook_input || '',
            requestDataMsg:JSON.stringify(msg),
            extras:JSON.stringify(extras_input),
            request_group_id,
            request_data_id
        }
        await insertTikTokScrapingRequest(requestData);
    }

    return c.json({ 
        status: 'ok', 
        message: 'Hashtag scraping request received',
        data: { sent_messages: messages_input.length }
    });
  } catch (error) {
    return c.json({ error: 'Invalid input' }, 400);
  }
})


scraperTiktok.post('/trigger-all-listing-new', async(c)=>{
  try {
    const dispatchResult = await putAllListingToQueueWorker(c.env);
    return c.json(dispatchResult);
    
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error dispatching scraping job:', errMsg);
    return c.json({ error: `Failed to dispatch scraping job: ${errMsg}` }, 500);
  }
    
})

scraperTiktok.post('/trigger-specific-hashtag',
  zValidator('json', hashtagSpecificInputSchema),
  async(c)=>{
    try {
        const messages = c.req.valid('json');
          const hashtag = messages.hashtag;
          if(!hashtag){
            return c.json({ error: 'Hashtag query parameter is required' }, 400);
          }
        const dispatchResult = await dispatchScraperListingSpecificHashtagJob(c.env, hashtag);
        return c.json(dispatchResult);
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error dispatching specific hashtag scraping job:', errMsg);
        return c.json({ error: `Failed to dispatch specific hashtag scraping job: ${errMsg}` }, 500);
    }
    
})

scraperTiktok.post('/trigger-item-scraping-new', async(c)=>{
  try {
    const dispatchResult = await dispacthItemScrapingJob(c.env);
    return c.json(dispatchResult);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error dispatching item scraping job:', errMsg);
    return c.json({ error: `Failed to dispatch item scraping job: ${errMsg}` }, 500);
  }
  
})

export const putAllListingToQueueWorker = async (env: AppEnv) => {
  try {
    const result = await getTiktokScrapingRequestList();
    // console.log(`Found ${result.length} scraping requests to dispatch`);  
    for (const request of result) {
      // console.log(`Dispatching request ID: ${request.id}, Hashtag: ${request.hashtag}`);
      await env.tiktok_listing_job.send({ 
        hashtag: request.hashtag || '',
        id: request.id,
      });
    }
    // console.log(`Successfully dispatched ${result.length} scraping jobs to the queue`);
    return { dispatched: result.length, message: `Dispatched ${result.length} scraping jobs to the queue` };
  } catch (error) {
    // console.error('Error in putAllListingToQueueWorker:', error instanceof Error ? error.message : error);
    return { dispatched: 0, message: `Error dispatching scraping job: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
};

export const putFromQueueWorkerToQueueAMQP = async (message: { hashtag: string; id: string },env: AppEnv) => {

  try {
    // console.log(`Received message from queue worker: Hashtag: ${message.hashtag}, ID: ${message.id}`);
    const sendResult = await sendToQueue(env, { 
      hashtag: message.hashtag || '',
      id: message.id.toString(),
    });
    // if (sendResult.success) {
    //   console.log(`Successfully sent message to AMQP queue for Hashtag: ${message.hashtag}, ID: ${message.id}`);
    // } else {
    //   console.error(`Failed to send message to AMQP queue for Hashtag: ${message.hashtag}, ID: ${message.id}. Status: ${sendResult.status}, Error: ${sendResult.error}`);
    // }
  }
  catch(error){
    console.error('Error in putFromQueueWorkerToQueueAMQP:', error instanceof Error ? error.message : error);
  }
}



export const dispatchScrapingJob = async(env: AppEnv) => {

  try{
    // get tiktok scraping request list
      const requestList = await getTiktokScrapingRequestList();
  
      if(requestList.length === 0){
          return { dispatched: 0, message: "No scraping requests found" };
      }
  
      // send to queue incrementally by 10
      const batchSize = 5;
      let dispatchedCount = 0;
  
      for(let i=0; i<requestList.length; i+=batchSize){
          const batch = requestList.slice(i, i+batchSize);
          
          await Promise.all(
              batch.map(request => sendToQueue(env, { 
                  hashtag: request.hashtag || '',
                  id: request.id,
              }))
          );
          dispatchedCount += batch.length;
      }
 
      return { 
          dispatched: requestList.length, 
          message: `Dispatched ${requestList.length} scraping jobs to the queue` 
      };
    }catch(error){
      console.error('Error in dispatchScrapingJob:', error instanceof Error ? error.message : error);
      return { dispatched: 0, message: `Error dispatching scraping job: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
};

export const dispatchScraperListingSpecificHashtagJob = async(env: AppEnv, hashtag: string) =>{

  try {
    
  
      const requestList = await getTiktokScrapingRequestByHashtag(hashtag);

      if(requestList.length === 0){
          return { dispatched: 0, message: "No scraping requests found" };
      }
      const batchSize = 5;
      let dispatchedCount = 0;

      for(let i=0; i<requestList.length; i+=batchSize){
          const batch = requestList.slice(i, i+batchSize);
          await Promise.all(batch.map(request => sendToQueue(env, { 
              hashtag: request.hashtag||'',
              id: request.id,
          }
              
          )));
          dispatchedCount += batch.length;
      }

      return { dispatched: dispatchedCount, message: `Dispatched ${dispatchedCount} scraping jobs to the queue` };

    } catch (error) {
      console.error('Error in dispatchScraperListingSpecificHashtagJob:', error instanceof Error ? error.message : error);
      return { dispatched: 0, message: `Error dispatching specific hashtag scraping job: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }

}
export const dispacthItemScrapingJob = async(env: AppEnv) => {
  // get all tiktok scraped url list
  try {
    const listingData = await getTiktokListingVideosWithWebhook();
    // console.log(`Found ${listingData.length} listing videos to dispatch for item scraping`);
    for (const data of listingData) {
      // console.log(`Request ID: ${data.id}, videos length: ${data.videos.length}`);
      const batchSize = 50;
      for(let i=0; i<data.videos.length; i+=batchSize){
          const batch = data.videos.slice(i, i+batchSize);
          const webhook_internal_scraper = `${env.WEBHOOK_URL}?request_id=${data.id}`;
          await env.tiktok_items_job.send({
            requestId: data.id,
            video_urls : batch.map(item => item.url),
            webhook_internal_scraper
          });
      }   
          
    }

    await updateItemJobLastRunByNow();

    return{ dispatched: listingData.reduce((acc, data) => acc + data.videos.length, 0), message: `Dispatched item scraping jobs for ${listingData.length} listing entries` };

  } catch (error) {
    console.error('Error in dispatchItemScrapingJob:', error instanceof Error ? error.message : error);
    return { dispatched: 0, message: `Error dispatching item scraping job: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

export const pushToBrightData = async(video_urls: string[],webhook_url:string, env: AppEnv)=>{
  try {
    await scrapeVideosByUrl(env, video_urls, webhook_url);
  } catch (error) {
    console.error('Error in pushToBrightData:', error instanceof Error ? error.message : error);
  }
}


export default scraperTiktok;