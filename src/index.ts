import { Hono } from 'hono'

type Bindings = {
  CLOUDAMQP_HTTP_URL:string;
  CLOUDAMQP_USERNAME:string;
  CLOUDAMQP_PASSWORD:string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.post('/send-message', async (c) => {
  try {
    const body = await c.req.json();
    const message = JSON.stringify(body);

    // send via http 
    const httpUrl = c.env.CLOUDAMQP_HTTP_URL;
    const amqpUser = c.env.CLOUDAMQP_USERNAME;
    const amqpPass = c.env.CLOUDAMQP_PASSWORD;

    if (!httpUrl) {
      return c.json({ error: 'CloudAMQP HTTP URL not configured' }, 500);
    }

   await fetch(httpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${amqpUser}:${amqpPass}`)}` 
      },
      body: JSON.stringify({
        properties: {
          delivery_mode: 2, // persistent
        },
        routing_key: 'scrape_request_listing',
        payload: message,
        payload_encoding: 'string'
      })
    });
    
    return c.json({ 
      success: true, 
      message: 'Message sent to CloudAMQP',
      data: body 
    });
    
  } catch (error) {
    console.error('Error sending message:', error);
    return c.json({ 
      error: 'Failed to send message',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

app.get('/', (c) => {
  return c.text('here is scraper api by')
})

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

export default app
