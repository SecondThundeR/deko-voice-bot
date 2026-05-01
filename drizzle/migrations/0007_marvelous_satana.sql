DROP INDEX "voices_table_voice_title_idx";--> statement-breakpoint
DROP INDEX "users_table_active_last_used_at_idx";--> statement-breakpoint
DROP INDEX "users_table_active_uses_amount_idx";--> statement-breakpoint
DROP INDEX "voices_table_uses_amount_idx";--> statement-breakpoint
ALTER TABLE "users_table" ALTER COLUMN "uses_amount" SET NOT NULL;--> statement-breakpoint
CREATE INDEX "payments_user_id_idx" ON "payments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_table_active_last_used_at_idx" ON "users_table" USING btree ("last_used_at" DESC NULLS LAST) WHERE "users_table"."is_ignored" = false and "users_table"."uses_amount" > 0;--> statement-breakpoint
CREATE INDEX "users_table_active_uses_amount_idx" ON "users_table" USING btree ("uses_amount" DESC NULLS LAST) WHERE "users_table"."is_ignored" = false;--> statement-breakpoint
CREATE INDEX "voices_table_uses_amount_idx" ON "voices_table" USING btree ("uses_amount" DESC NULLS LAST);