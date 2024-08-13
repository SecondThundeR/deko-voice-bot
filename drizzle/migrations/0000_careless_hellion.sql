CREATE TABLE IF NOT EXISTS "feature_flags_table" (
	"name" varchar(255) PRIMARY KEY NOT NULL,
	"status" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users_favorites_table" (
	"user_id" bigint NOT NULL,
	"voice_id" varchar(64) NOT NULL,
	CONSTRAINT "users_favorites_table_user_id_voice_id_pk" PRIMARY KEY("user_id","voice_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users_table" (
	"user_id" bigint PRIMARY KEY NOT NULL,
	"fullname" varchar(128),
	"username" varchar(32),
	"uses_amount" integer DEFAULT 0,
	"last_used_at" bigint,
	"is_ignored" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "voices_table" (
	"voice_id" varchar(64) PRIMARY KEY NOT NULL,
	"voice_title" varchar(128) NOT NULL,
	"url" varchar,
	"file_id" varchar(128),
	"voice_inique_id" varchar(32) NOT NULL,
	"uses_amount" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_favorites_table" ADD CONSTRAINT "users_favorites_table_user_id_users_table_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users_table"("user_id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users_favorites_table" ADD CONSTRAINT "users_favorites_table_voice_id_voices_table_voice_id_fk" FOREIGN KEY ("voice_id") REFERENCES "public"."voices_table"("voice_id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
