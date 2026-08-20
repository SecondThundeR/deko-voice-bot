UPDATE "users_table" SET "uses_amount" = 0 WHERE "uses_amount" IS NULL;--> statement-breakpoint
ALTER TABLE "users_table" ALTER COLUMN "uses_amount" SET NOT NULL;
