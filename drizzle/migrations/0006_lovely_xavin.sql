ALTER TYPE "public"."payment_status" ADD VALUE 'refund_pending' BEFORE 'refunded';--> statement-breakpoint
DROP INDEX "users_table_last_used_at_idx";--> statement-breakpoint
DROP INDEX "users_table_uses_amount_idx";--> statement-breakpoint
DROP INDEX "voices_table_file_unique_id_idx";--> statement-breakpoint
CREATE INDEX "users_table_active_last_used_at_idx" ON "users_table" USING btree (coalesce("last_used_at", 0) desc) WHERE "users_table"."is_ignored" = false and "users_table"."uses_amount" <> 0;--> statement-breakpoint
CREATE INDEX "users_table_active_uses_amount_idx" ON "users_table" USING btree (coalesce("uses_amount", 0) desc) WHERE "users_table"."is_ignored" = false;--> statement-breakpoint
CREATE INDEX "users_table_inactive_last_used_at_idx" ON "users_table" USING btree ("last_used_at") WHERE "users_table"."is_ignored" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "voices_table_file_unique_id_idx" ON "voices_table" USING btree ("file_unique_id");