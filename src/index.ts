import { Hono } from 'hono'
import * as z from 'zod'
import { zValidator } from '@hono/zod-validator'
import { InstagramPost_gd_lk5ns7kz21pck8jpis } from '../types/intagram_posts_gd_lk5ns7kz21pck8jpis';


type Bindings = {
  CLOUDAMQP_HTTP_URL:string;
  CLOUDAMQP_USERNAME:string;
  CLOUDAMQP_PASSWORD:string;
  APP_PUBLIC_URL:string;
};

const app = new Hono<{ Bindings: Bindings }>();

const itemSchema =z.object({
    data_size:z.number().min(1),
    account_name:z.string().optional(),
    date_start:z.string().optional(),
    date_end:z.string().optional(),
  });

const inputSchema = z.object({
  webhook_url:z.url().optional(),
  extras:z.record(z.string(), z.any()).optional(),
  data:z.array(itemSchema).min(1).max(50),
})


app.post('/scrape/instagram/tagged',
  zValidator('json', inputSchema),
  async (c) => {
  try {
    const messages = c.req.valid('json');

    // send via http 
    const httpUrl = c.env.CLOUDAMQP_HTTP_URL;
    const amqpUser = c.env.CLOUDAMQP_USERNAME;
    const amqpPass = c.env.CLOUDAMQP_PASSWORD;

    if (!httpUrl) {
      return c.json({ error: 'CloudAMQP HTTP URL not configured' }, 500);
    }

    // parallel for each message
    

    const webhook_input = messages.webhook_url;

    const extras_input = messages.extras || {};
    const messages_input = messages.data;
    const msgSends = messages_input.map(msg => {
      const tagged_url = `https://www.instagram.com/${msg.account_name}/tagged`;
      const scraper_webhook = `${c.env.APP_PUBLIC_URL}/webhooks/instagram/tagged?account_name=${msg.account_name}&client_webhook=${webhook_input}&extras=${encodeURIComponent(JSON.stringify(extras_input))}`;
      
      const payload_args = {
        url: tagged_url,
        max_item: msg.data_size,
        webhook_endpoint: scraper_webhook,
      };

      const payloadMsg = JSON.stringify({
        "task":"run_instagram_listing_scraper",
        "args": [payload_args]
      })


      return fetch(httpUrl, {
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
          routing_key: 'scrape_request_listing',
          payload: payloadMsg,
          payload_encoding: 'string'
        })
      });
    });

    await Promise.all(msgSends);
    
    return c.json({ 
      success: true, 
      message: 'Message sent to CloudAMQP',
      data: { sent_messages: messages_input.length } 
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    return c.json({ 
      error: 'Failed to send message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

app.post('/webhooks/instagram/tagged', async (c) => {
  // get params
  const client_webhook = c.req.query('client_webhook');
  const account_name = c.req.query('account_name');
  const extras_param = c.req.query('extras');

  const payload_resp:InstagramPost_gd_lk5ns7kz21pck8jpis[] = await c.req.json();

  const payload ={
    account_name,
    date_scraped: new Date().toISOString(),
    posts: payload_resp,
    extras: extras_param ? JSON.parse(extras_param) : {},
  }

  if (client_webhook) {
    
      // assume always successful
      
      await fetch(client_webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
  } 
  
  return c.json({ success: true, message: 'Data received'});
  
});

app.get('/', (c) => {
  return c.text('scraper api')
})

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

export default app
