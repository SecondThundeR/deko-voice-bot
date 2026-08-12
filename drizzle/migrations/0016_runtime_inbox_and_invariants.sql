DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM voices GROUP BY file_unique_id HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Cannot add voices_file_unique_id_unique: duplicate file_unique_id values exist';
    END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "voices" ALTER COLUMN "uses_amount" SET DATA TYPE bigint;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "uses_amount" SET DATA TYPE bigint;
--> statement-breakpoint
ALTER TABLE "voices" ADD CONSTRAINT "voices_file_unique_id_unique" UNIQUE("file_unique_id");
--> statement-breakpoint
ALTER TABLE "voices" ADD CONSTRAINT "voices_uses_amount_nonnegative" CHECK ("uses_amount" >= 0);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_uses_amount_nonnegative" CHECK ("uses_amount" >= 0);
--> statement-breakpoint
ALTER TABLE "voices" ADD CONSTRAINT "voices_uses_amount_safe_integer" CHECK ("uses_amount" <= 9007199254740991);
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_uses_amount_safe_integer" CHECK ("uses_amount" <= 9007199254740991);
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "refund_started_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "refunded_at" timestamp with time zone;
--> statement-breakpoint
CREATE SCHEMA IF NOT EXISTS "bot_runtime";
--> statement-breakpoint
CREATE TABLE "bot_runtime"."webhook_inbox" (
    "update_id" bigint PRIMARY KEY,
    "payload" jsonb,
    "routing_key" text NOT NULL,
    "priority" smallint NOT NULL DEFAULT 0,
    "retryable" boolean NOT NULL DEFAULT false,
    "status" text NOT NULL DEFAULT 'pending',
    "attempts" integer NOT NULL DEFAULT 0,
    "last_error" text,
    "received_at" timestamp with time zone NOT NULL DEFAULT now(),
    "available_at" timestamp with time zone NOT NULL DEFAULT now(),
    "claimed_at" timestamp with time zone,
    "processed_at" timestamp with time zone,
    CONSTRAINT "webhook_inbox_status_check" CHECK (status IN ('pending', 'processing', 'failed', 'completed')),
    CONSTRAINT "webhook_inbox_attempts_nonnegative" CHECK (attempts >= 0)
);
--> statement-breakpoint
CREATE INDEX "webhook_inbox_claim_idx" ON "bot_runtime"."webhook_inbox" (priority DESC, available_at, received_at) WHERE status IN ('pending', 'processing');
--> statement-breakpoint
CREATE INDEX "webhook_inbox_cleanup_idx" ON "bot_runtime"."webhook_inbox" (processed_at) WHERE status = 'completed';
