CREATE TYPE "public"."payment_status" AS ENUM('paid', 'refunded');--> statement-breakpoint
CREATE TABLE "payments" (
	"telegram_payment_charge_id" text PRIMARY KEY NOT NULL,
	"invoice_payload" text NOT NULL,
	"user_id" bigint NOT NULL,
	"amount" integer NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL,
	"status" "payment_status" DEFAULT 'paid' NOT NULL
);
