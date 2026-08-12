ALTER TABLE "feature_flags_table" RENAME TO "feature_flags";--> statement-breakpoint
ALTER TABLE "users_favorites_table" RENAME TO "users_favorites";--> statement-breakpoint
ALTER TABLE "users_table" RENAME TO "users";--> statement-breakpoint
ALTER TABLE "voices_table" RENAME TO "voices";--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_user_id_users_table_user_id_fk";
--> statement-breakpoint
ALTER TABLE "users_favorites" DROP CONSTRAINT "users_favorites_table_user_id_users_table_user_id_fk";
--> statement-breakpoint
ALTER TABLE "users_favorites" DROP CONSTRAINT "users_favorites_table_voice_id_voices_table_voice_id_fk";
--> statement-breakpoint
DROP INDEX "users_table_active_last_used_at_idx";--> statement-breakpoint
ALTER TABLE "users_favorites" DROP CONSTRAINT "users_favorites_table_user_id_voice_id_pk";--> statement-breakpoint
ALTER TABLE "users_favorites" ADD CONSTRAINT "users_favorites_user_id_voice_id_pk" PRIMARY KEY("user_id","voice_id");--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users_favorites" ADD CONSTRAINT "users_favorites_user_id_users_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("user_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users_favorites" ADD CONSTRAINT "users_favorites_voice_id_voices_voice_id_fk" FOREIGN KEY ("voice_id") REFERENCES "public"."voices"("voice_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "users_active_last_used_at_idx" ON "users" USING btree ("last_used_at" DESC NULLS LAST) WHERE "users"."is_ignored" = false and "users"."uses_amount" > 0;