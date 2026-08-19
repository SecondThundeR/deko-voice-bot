CREATE EXTENSION IF NOT EXISTS pg_trgm;
ALTER TYPE "public"."payment_status" ADD VALUE 'refund_pending' BEFORE 'refunded';--> statement-breakpoint
CREATE INDEX "payments_user_id_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_favorites_table_voice_id_idx" ON "users_favorites_table" USING btree ("voice_id");--> statement-breakpoint
CREATE INDEX "users_table_active_last_used_at_idx" ON "users_table" USING btree ("last_used_at" DESC NULLS LAST) WHERE "users_table"."is_ignored" = false and "users_table"."uses_amount" > 0;--> statement-breakpoint
CREATE INDEX "users_table_active_uses_amount_idx" ON "users_table" USING btree ("uses_amount" DESC NULLS LAST) WHERE "users_table"."is_ignored" = false;--> statement-breakpoint
CREATE INDEX "users_table_inactive_last_used_at_idx" ON "users_table" USING btree ("last_used_at") WHERE "users_table"."is_ignored" = false;--> statement-breakpoint
CREATE UNIQUE INDEX "voices_table_file_unique_id_idx" ON "voices_table" USING btree ("file_unique_id");--> statement-breakpoint
CREATE INDEX "voices_table_uses_amount_idx" ON "voices_table" USING btree ("uses_amount" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "voices_table_voice_title_trgm_idx" ON "voices_table" USING gin ("voice_title" gin_trgm_ops);