import { Hono } from 'hono';
import { AppEnv } from '../../../types/Env_types';
import { Variables } from 'hono/types';


const mobile_worker = new Hono<{ Bindings: AppEnv,Variables:Variables }>();

mobile_worker.get('/get-job', (c) => {
  return c.json(['wardah']);
});

export default mobile_worker;