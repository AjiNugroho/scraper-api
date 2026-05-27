CREATE TABLE "job_hashtag" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hashtag" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_hashtag_hashtag_unique" UNIQUE("hashtag")
);
--> statement-breakpoint
CREATE TABLE "tiktok_hashtag_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listen_group_id" integer NOT NULL,
	"request_data_id" integer NOT NULL,
	"hashtag" text NOT NULL,
	"webhook_url" text,
	"extras" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tiktok_hashtag_video_result" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_name" text NOT NULL,
	"video_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "worker_hashtag_task" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_id" uuid NOT NULL,
	"hashtag_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "worker_hashtag_task_hashtag_id_unique" UNIQUE("hashtag_id")
);
--> statement-breakpoint
CREATE TABLE "workers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "workers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "worker_hashtag_task" ADD CONSTRAINT "worker_hashtag_task_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_hashtag_task" ADD CONSTRAINT "worker_hashtag_task_hashtag_id_job_hashtag_id_fk" FOREIGN KEY ("hashtag_id") REFERENCES "public"."job_hashtag"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_hashtag_request_group_data" ON "tiktok_hashtag_request" USING btree ("listen_group_id","request_data_id","hashtag");