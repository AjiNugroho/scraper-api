export type AppEnv = {
  CLOUDAMQP_HTTP_URL: string;
  CLOUDAMQP_USERNAME: string;
  CLOUDAMQP_PASSWORD: string;
  CLOUDAMQP_QUEUE_NAME?: string;
  BDTOKENSECRET: string;
  WEBHOOK_URL: string;
  MAIN_APP_URL: string;
  tiktok_listing_job:Queue;
  tiktok_items_job:Queue;
  
}