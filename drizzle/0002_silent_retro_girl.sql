CREATE TABLE "tiktok_hashtag_listing_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"hashtag" text NOT NULL,
	"video_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tiktok_scraping_requests" ADD COLUMN "request_group_id" text;--> statement-breakpoint
ALTER TABLE "tiktok_scraping_requests" ADD COLUMN "request_data_id" text;--> statement-breakpoint
ALTER TABLE "tiktok_hashtag_listing_videos" ADD CONSTRAINT "tiktok_hashtag_listing_videos_request_id_tiktok_scraping_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."tiktok_scraping_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_request_hashtag_video" ON "tiktok_hashtag_listing_videos" USING btree ("request_id","hashtag","video_url");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_identifier_group_data" ON "tiktok_scraping_requests" USING btree ("identifier","request_group_id","request_data_id") WHERE "tiktok_scraping_requests"."request_group_id" != '' AND "tiktok_scraping_requests"."request_data_id" != '';