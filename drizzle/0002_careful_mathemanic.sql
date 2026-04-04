CREATE TABLE "tiktok_scraping_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hashtag" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
