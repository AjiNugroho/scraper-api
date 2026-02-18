
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { betterAuth } from 'better-auth';
import {schema} from '../db/schema';
import { admin, apiKey } from "better-auth/plugins"

const { DATABASE_URL, BETTER_AUTH_URL, BETTER_AUTH_SECRET } = process.env;

const sql = neon(DATABASE_URL!);
const db = drizzle(sql);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,

  emailAndPassword:{
    enabled: true,
  },
  trustedOrigins:[
    'http://localhost:3000',
    'https://api.fair-studio.com'
  ],
  plugins: [ 
    apiKey({
      permissions:{
          defaultPermissions:{
              users:['create','read','update','delete']
          }
      },
      rateLimit: {
          enabled: true,
          timeWindow: 1000 * 60,
          maxRequests: 100,
      }
  }), 
  admin()
  ] 
});