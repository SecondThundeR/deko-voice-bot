CREATE EXTENSION IF NOT EXISTS "pg_trgm";--> statement-breakpoint
CREATE INDEX "users_favorites_table_voice_id_idx" ON "users_favorites_table" USING btree ("voice_id");--> statement-breakpoint
CREATE INDEX "users_table_last_used_at_idx" ON "users_table" USING btree ("last_used_at");--> statement-breakpoint
CREATE INDEX "users_table_uses_amount_idx" ON "users_table" USING btree ("uses_amount");--> statement-breakpoint
CREATE INDEX "voices_table_file_unique_id_idx" ON "voices_table" USING btree ("file_unique_id");--> statement-breakpoint
CREATE INDEX "voices_table_uses_amount_idx" ON "voices_table" USING btree ("uses_amount");--> statement-breakpoint
CREATE INDEX "voices_table_voice_title_idx" ON "voices_table" USING btree ("voice_title");--> statement-breakpoint
CREATE INDEX "voices_table_voice_title_trgm_idx" ON "voices_table" USING gin ("voice_title" gin_trgm_ops);
