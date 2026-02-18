import { Context, Next } from 'hono';
import { auth } from '../lib/auth';

export async function apiKeyAuth(c:Context, next:Next){
    const apiKey = c.req.header('x-api-key');
    
    if (!apiKey) {
        return c.json({ error: 'API key is required' }, 401);
    }

    try {
        const data = await auth.api.verifyApiKey({
            body:{
                key: apiKey
            }
        });

        if(!data.valid){
            return c.json({ error: 'You dont have access' }, 403);
        }
        const keyName = data.key?.name || 'unknown';
        if(keyName==='unknown'){
            return c.json({ error: 'You dont have access' }, 403);
        }
        c.set('apiKeyName', keyName);
        await next();

    } catch (error) {
        return c.json({ error: 'Authentication Failed' }, 401);
        
    }
}