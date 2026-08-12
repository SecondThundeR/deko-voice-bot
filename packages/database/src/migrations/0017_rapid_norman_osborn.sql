CREATE TYPE "public"."voice_submission_status" AS ENUM('uploading', 'pending', 'processing', 'approved', 'rejected', 'failed');--> statement-breakpoint
CREATE TABLE "voice_submissions" (
	"id" uuid PRIMARY KEY NOT NULL,
	"submitter_user_id" bigint NOT NULL,
	"title" varchar(128) NOT NULL,
	"source_file_id" varchar(128),
	"source_file_unique_id" varchar(32),
	"source_chat_id" bigint,
	"source_message_id" integer,
	"status" "voice_submission_status" DEFAULT 'uploading' NOT NULL,
	"moderator_user_id" bigint,
	"rejection_reason" varchar(512),
	"approved_voice_id" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finalized_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "voice_submissions" ADD CONSTRAINT "voice_submissions_submitter_user_id_users_user_id_fk" FOREIGN KEY ("submitter_user_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "voice_submissions" ADD CONSTRAINT "voice_submissions_approved_voice_id_voices_voice_id_fk" FOREIGN KEY ("approved_voice_id") REFERENCES "public"."voices"("voice_id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "voice_submissions_submitter_created_idx" ON "voice_submissions" USING btree ("submitter_user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "voice_submissions_status_created_idx" ON "voice_submissions" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "voice_submissions_finalized_idx" ON "voice_submissions" USING btree ("finalized_at");--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bot_runtime"."service_state" (
    "singleton" boolean PRIMARY KEY DEFAULT true CHECK (singleton),
    "maintenance" boolean NOT NULL DEFAULT false,
    "generation" bigint NOT NULL DEFAULT 0,
    "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);--> statement-breakpoint
INSERT INTO "bot_runtime"."service_state" ("singleton")
VALUES (true)
ON CONFLICT ("singleton") DO NOTHING;
