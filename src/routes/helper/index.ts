import { Hono } from 'hono';
import {z} from 'zod'
import { zValidator } from '@hono/zod-validator'

const helper = new Hono<{ Bindings: CloudflareBindings }>();

const expandUrlSchema = z.object({
  url: z.url() 
});

helper.post('/expand-url', 
  zValidator('json', expandUrlSchema),
  async (c) => {
  try {

    const body = c.req.valid('json');
    const { url } = body

   
    const response = await fetch(url, {
      method: "GET",
      redirect: "manual",
      headers: {
        "User-Agent":
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
        "Referer": "https://www.tiktok.com/"
      }
    })

    const location = response.headers.get("location")

    if (!location) {
      return c.text("No redirect found", 400)
    }

    const urlFinal = location.split('?')[0]

    return c.json({ url: urlFinal })

  } catch (error) {
    return c.json({ error: 'Failed to expand URL safely. It might be invalid, malicious, or unresolvable.' }, 400);
  }
});


export default helper;