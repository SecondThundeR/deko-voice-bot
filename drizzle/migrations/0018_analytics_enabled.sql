ALTER TABLE "users" RENAME COLUMN "is_ignored" TO "analytics_enabled";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "analytics_enabled" SET DEFAULT true;--> statement-breakpoint
UPDATE "users" SET "analytics_enabled" = NOT "analytics_enabled";--> statement-breakpoint
DROP INDEX "users_active_last_used_at_idx";--> statement-breakpoint
CREATE INDEX "users_active_last_used_at_idx" ON "users" USING btree ("last_used_at" DESC NULLS LAST) WHERE "users"."analytics_enabled" = true and "users"."uses_amount" > 0;
