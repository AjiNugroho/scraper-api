import { db } from "../db/drizzle";
import { ScraperRequestLog, WebhookClientLog, WorkerRequestLog } from "../db/schema";

interface ScraperRequestLog {
    keyName: string;
    scraper:string;
    webhook_url:string;
    requestDataMsg:string;
    extras?:string;
}

export const logScraperRequest = async({keyName,extras,requestDataMsg,scraper,webhook_url}:ScraperRequestLog)=>{
    try {
        await db.insert(ScraperRequestLog).values({
            keyName,
            scraper,
            webhook_url,
            requestDataMsg,
            extras
        })
    } catch (error) {
        console.error("Failed to log scraper request:", error);
    }
}


interface ReportDataSchema{
    worker:string;
    task:string;
    target_url:string;
    requested_max_item:number;
    scraper_list_collected_count:number;
    chunk_start_index:number;
    chunk_size:number;
    post_urls:{url:string}[];
    snapshot_id?:string;
    webhooks_endpoint?:string;
}

export const logWorkerRequest = async(data:ReportDataSchema)=>{
    try{
        await db.insert(WorkerRequestLog).values({
           ...data
        })
    }
    catch(error){
        console.error("Failed to log worker request:", error);
    }
}

interface WebhookClientLogSchema{
    webhook_url:string;
    account_name?:string;
    extras?:object;
    total_scrape_response_count:number;
    valid_scrape_count:number;
    raw_payload:object;
    response_status?:number;
    response_body?:string;
    error_message?:string;
}

export const logWebhookClientRequest = async(data:WebhookClientLogSchema)=>{
    try{
        await db.insert(WebhookClientLog).values({
           ...data
        })
    }
    catch(error){
        console.error("Failed to log webhook client request:", error);
    }
}