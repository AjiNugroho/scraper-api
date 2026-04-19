import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  index,
  uuid,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
  role: text("role"),
  banned: boolean("banned").default(false),
  banReason: text("ban_reason"),
  banExpires: timestamp("ban_expires"),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const apikey = pgTable(
  "apikey",
  {
    id: text("id").primaryKey(),
    name: text("name"),
    start: text("start"),
    prefix: text("prefix"),
    key: text("key").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    refillInterval: integer("refill_interval"),
    refillAmount: integer("refill_amount"),
    lastRefillAt: timestamp("last_refill_at"),
    enabled: boolean("enabled").default(true),
    rateLimitEnabled: boolean("rate_limit_enabled").default(true),
    rateLimitTimeWindow: integer("rate_limit_time_window").default(60000),
    rateLimitMax: integer("rate_limit_max").default(100),
    requestCount: integer("request_count").default(0),
    remaining: integer("remaining"),
    lastRequest: timestamp("last_request"),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    permissions: text("permissions"),
    metadata: text("metadata"),
  },
  (table) => [
    index("apikey_key_idx").on(table.key),
    index("apikey_userId_idx").on(table.userId),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  apikeys: many(apikey),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const apikeyRelations = relations(apikey, ({ one }) => ({
  user: one(user, {
    fields: [apikey.userId],
    references: [user.id],
  }),
}));

export const ScraperRequestLog = pgTable("scraper_request_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  keyName : text("key_name").notNull(),
  scraper: text("scraper").notNull(),
  webhook_url: text("webhook_url").notNull(),
  requestDataMsg: jsonb("request_data_msg").notNull(),
  extras: jsonb("extras"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const WorkerRequestLog = pgTable("worker_request_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  worker: text("worker").notNull(),
  task: text("task").notNull(),
  target_url: text("target_url").notNull(),
  requested_max_item: integer("requested_max_item").notNull(),
  scraper_list_collected_count: integer("scraper_list_collected_count").notNull(),
  chunk_start_index: integer("chunk_start_index").notNull(),
  chunk_size: integer("chunk_size").notNull(),
  post_urls: jsonb("posts_url").notNull(),
  snapshot_id: text("snapshot_id"),
  webhooks_endpoint: text("webhooks_endpoint"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const WebhookClientLog = pgTable("webhook_client_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  webhook_url: text("webhook_url").notNull(),
  account_name: text("account_name"),
  extras: jsonb("extras"),
  total_scrape_response_count: integer("total_scrape_response_count").notNull(),
  valid_scrape_count: integer("valid_scrape_count").notNull(),
  raw_payload: jsonb("raw_payload").notNull(),
  response_status: integer("response_status"),
  response_body: text("response_body"),
  error_message: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const WebhookClientLogTiktok = pgTable("webhook_client_log_tiktok", {
  id: uuid("id").primaryKey().defaultRandom(),
  webhook_url: text("webhook_url").notNull(),
  tiktok_hashtag: text("tiktok_hashtag").notNull(),
  extras: jsonb("extras"),
  total_scrape_response_count: integer("total_scrape_response_count").notNull(),
  valid_scrape_count: integer("valid_scrape_count").notNull(),
  response_status: integer("response_status"),
  response_body: text("response_body"),
  error_message: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const tiktokScrapingRequests = pgTable("tiktok_scraping_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  keyName : text("key_name").notNull(),
  scraper: text("scraper").notNull(),
  identifier: text("identifier"),
  webhook_url: text("webhook_url").notNull(),
  requestDataMsg: jsonb("request_data_msg").notNull(),
  request_group_id: text("request_group_id"),
  request_data_id: text("request_data_id"),
  extras: jsonb("extras"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
},
(table) => [
  uniqueIndex("uq_identifier_group_data")
    .on(table.identifier, table.request_group_id, table.request_data_id)
    .where(
      sql`${table.request_group_id} != '' AND ${table.request_data_id} != ''`
    ),
]

);

export const tiktokHashTagListingVideos = pgTable("tiktok_hashtag_listing_videos", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id").notNull().references(() => tiktokScrapingRequests.id, { onDelete: "cascade" }),
  hashtag: text("hashtag").notNull(),
  video_url: text("video_url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
},
(table) => [
  uniqueIndex("uq_request_hashtag_video")
    .on(table.requestId, table.hashtag, table.video_url),
]
);

export const cronLogs = pgTable("cron_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  cronExpression: text("cron_expression").notNull(),
  jobType: text("job_type").notNull(),
  triggeredBy: text("triggered_by").notNull(),
  status: text("status").notNull(),
  dispatched: integer("dispatched").default(0),
  message: text("message"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const schema = {user,session,account,verification,apikey};