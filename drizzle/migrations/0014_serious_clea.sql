CREATE TABLE "processed_usage_updates" (
	"update_id" bigint PRIMARY KEY NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
UPDATE "users"
SET
	"fullname" = NULL,
	"username" = NULL,
	"uses_amount" = 0,
	"last_used_at" = NULL
WHERE "is_ignored" = true;
