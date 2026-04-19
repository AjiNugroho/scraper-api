CREATE TABLE "cron_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cron_expression" text NOT NULL,
	"job_type" text NOT NULL,
	"triggered_by" text NOT NULL,
	"status" text NOT NULL,
	"dispatched" integer DEFAULT 0,
	"message" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
