CREATE SCHEMA IF NOT EXISTS "bot_runtime";
--> statement-breakpoint
CREATE TABLE "bot_runtime"."outbox" (
    "id" uuid PRIMARY KEY,
    "job_type" text NOT NULL,
    "payload" jsonb NOT NULL DEFAULT '{}'::jsonb,
    "status" text NOT NULL DEFAULT 'pending',
    "priority" smallint NOT NULL DEFAULT 0,
    "attempts" integer NOT NULL DEFAULT 0,
    "max_attempts" integer NOT NULL DEFAULT 5,
    "last_error" text,
    "available_at" timestamp with time zone NOT NULL DEFAULT now(),
    "claimed_at" timestamp with time zone,
    "lease_owner" text,
    "lease_expires_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "failed_at" timestamp with time zone,
    "created_at" timestamp with time zone NOT NULL DEFAULT now(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT "outbox_status_check" CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    CONSTRAINT "outbox_attempts_nonnegative" CHECK (attempts >= 0),
    CONSTRAINT "outbox_max_attempts_positive" CHECK (max_attempts > 0),
    CONSTRAINT "outbox_initial_job_check" CHECK (job_type = 'outbox.noop.v1' AND payload = '{}'::jsonb),
    CONSTRAINT "outbox_processing_lease_check" CHECK (
        (status = 'processing' AND claimed_at IS NOT NULL AND lease_owner IS NOT NULL AND lease_expires_at IS NOT NULL)
        OR (status <> 'processing' AND claimed_at IS NULL AND lease_owner IS NULL AND lease_expires_at IS NULL)
    )
);
--> statement-breakpoint
CREATE INDEX "outbox_claim_idx"
    ON "bot_runtime"."outbox" (priority DESC, available_at, created_at)
    WHERE status IN ('pending', 'processing');
--> statement-breakpoint
CREATE INDEX "outbox_cleanup_idx"
    ON "bot_runtime"."outbox" (completed_at)
    WHERE status = 'completed';
--> statement-breakpoint
CREATE INDEX "outbox_failed_cleanup_idx"
    ON "bot_runtime"."outbox" (failed_at)
    WHERE status = 'failed';
