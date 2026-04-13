import { AppEnv } from "../../types/Env_types";

export interface QueueMessage {
  hashtag: string;
  id:string;
}


export const sendToQueue = async(env: AppEnv, msg: QueueMessage) => {
    // send via http 
    const httpUrl = env.CLOUDAMQP_HTTP_URL;
    const amqpUser = env.CLOUDAMQP_USERNAME;
    const amqpPass = env.CLOUDAMQP_PASSWORD;
    const queueName = env.CLOUDAMQP_QUEUE_NAME || "scrape_tiktok_incoming";
    
    if (!httpUrl) {
      return { success: false, error: 'CloudAMQP HTTP URL not configured' };
    }
 
    const payloadMsg = JSON.stringify({
        "task":"scrape_hashtag",
        "args": [msg.hashtag, msg.id]
    });
 
    try {
      const response = await fetch(httpUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${btoa(`${amqpUser}:${amqpPass}`)}` 
          },
          body: JSON.stringify({
            properties: {
              delivery_mode: 2, // persistent
              content_type: 'application/json', 
            },
            routing_key: queueName,
            payload: payloadMsg,
            payload_encoding: 'string'
          })
      });
 
      // Drain the response body to prevent stalled requests
      // Don't read it, just cancel it
      response.body?.cancel();
 
      return { 
        success: response.ok, 
        status: response.status 
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
};
