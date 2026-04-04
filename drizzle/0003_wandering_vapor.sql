CREATE TABLE "tiktok_scraped_videos" (
	"hashtag" text NOT NULL,
	"video_id" text NOT NULL,
	CONSTRAINT "tiktok_scraped_videos_hashtag_video_id_pk" PRIMARY KEY("hashtag","video_id")
);
