ALTER TABLE "voice_submissions" ADD COLUMN "requested_trim_start_ms" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "voice_submissions" ADD COLUMN "requested_trim_end_ms" integer;
