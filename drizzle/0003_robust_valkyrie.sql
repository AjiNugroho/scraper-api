CREATE TABLE "webhook_client_log_tiktok" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"webhook_url" text NOT NULL,
	"tiktok_hashtag" text NOT NULL,
	"extras" jsonb,
	"total_scrape_response_count" integer NOT NULL,
	"valid_scrape_count" integer NOT NULL,
	"response_status" integer,
	"response_body" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
