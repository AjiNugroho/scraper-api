CREATE TABLE "item_job_last_run" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"last_run_at" timestamp DEFAULT now() NOT NULL
);
