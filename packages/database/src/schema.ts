import { sql } from "drizzle-orm";
import {
    check,
    index,
    pgEnum,
    pgTable,
    primaryKey,
    unique,
} from "drizzle-orm/pg-core";

import {
    FEATURE_FLAG_NAME_LENGTH,
    FILE_ID_LENGTH,
    FILE_UNIQUE_ID_LENGTH,
    FULLNAME_LENGTH,
    USERNAME_LENGTH,
    VOICE_ID_LENGTH,
    VOICE_TITLE_LENGTH,
} from "./constraints.ts";

export const featureFlagsTable = pgTable("feature_flags", (t) => ({
    name: t.varchar({ length: FEATURE_FLAG_NAME_LENGTH }).primaryKey(),
    status: t.boolean().notNull().default(false),
}));

export type SelectFeatureFlag = typeof featureFlagsTable.$inferSelect;

export const voicesTable = pgTable(
    "voices",
    (t) => ({
        voiceId: t.varchar({ length: VOICE_ID_LENGTH }).primaryKey(),
        voiceTitle: t.varchar({ length: VOICE_TITLE_LENGTH }).notNull(),
        fileId: t.varchar({ length: FILE_ID_LENGTH }).notNull(),
        fileUniqueId: t.varchar({ length: FILE_UNIQUE_ID_LENGTH }).notNull(),
        usesAmount: t.bigint({ mode: "number" }).notNull().default(0),
    }),
    (table) => [
        unique("voices_file_unique_id_unique").on(table.fileUniqueId),
        check("voices_uses_amount_nonnegative", sql`${table.usesAmount} >= 0`),
        check(
            "voices_uses_amount_safe_integer",
            sql`${table.usesAmount} <= 9007199254740991`,
        ),
    ],
);

export type InsertVoice = typeof voicesTable.$inferInsert;
export type SelectVoice = typeof voicesTable.$inferSelect;

export const usersTable = pgTable(
    "users",
    (t) => ({
        userId: t.bigint({ mode: "number" }).primaryKey(),
        fullname: t.varchar({ length: FULLNAME_LENGTH }),
        username: t.varchar({ length: USERNAME_LENGTH }),
        usesAmount: t.bigint({ mode: "number" }).notNull().default(0),
        // Using `bigint` with `Date.now` timestamp here instead of `date/timestamp`
        // from drizzle-orm/pg-core for backwards compatibility after MongoDB migration
        lastUsedAt: t.bigint({ mode: "number" }),
        isIgnored: t.boolean().notNull().default(false),
    }),
    (table) => [
        index("users_active_last_used_at_idx")
            .on(table.lastUsedAt.desc())
            .where(sql`${table.isIgnored} = false and ${table.usesAmount} > 0`),
        check("users_uses_amount_nonnegative", sql`${table.usesAmount} >= 0`),
        check(
            "users_uses_amount_safe_integer",
            sql`${table.usesAmount} <= 9007199254740991`,
        ),
    ],
);

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;

export const usersFavoritesTable = pgTable(
    "users_favorites",
    (t) => ({
        userId: t
            .bigint({ mode: "number" })
            .notNull()
            .references(() => usersTable.userId, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        voiceId: t
            .varchar({ length: VOICE_ID_LENGTH })
            .notNull()
            .references(() => voicesTable.voiceId, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
    }),
    ({ userId, voiceId }) => [primaryKey({ columns: [userId, voiceId] })],
);

export type InsertUserFavorites = typeof usersFavoritesTable.$inferInsert;

export const processedUsageUpdatesTable = pgTable(
    "processed_usage_updates",
    (t) => ({
        updateId: t.bigint({ mode: "number" }).primaryKey(),
        processedAt: t.timestamp({ withTimezone: true }).defaultNow().notNull(),
    }),
);

export const paymentStatusEnum = pgEnum("payment_status", [
    "paid",
    "refund_pending",
    "refunded",
]);

export const paymentsTable = pgTable("payments", (t) => ({
    telegramPaymentChargeId: t.text().primaryKey(),
    invoicePayload: t.text().notNull(),
    userId: t
        .bigint({ mode: "number" })
        .notNull()
        .references(() => usersTable.userId, {
            onDelete: "restrict",
            onUpdate: "cascade",
        }),
    amount: t.integer().notNull(),
    paidAt: t.timestamp().defaultNow().notNull(),
    status: paymentStatusEnum().default("paid").notNull(),
    refundStartedAt: t.timestamp({ withTimezone: true }),
    refundedAt: t.timestamp({ withTimezone: true }),
}));

export const voiceSubmissionStatusEnum = pgEnum("voice_submission_status", [
    "uploading",
    "pending",
    "processing",
    "approved",
    "rejected",
    "failed",
]);

export const voiceSubmissionsTable = pgTable(
    "voice_submissions",
    (t) => ({
        id: t.uuid().primaryKey(),
        submitterUserId: t
            .bigint({ mode: "number" })
            .notNull()
            .references(() => usersTable.userId, {
                onDelete: "restrict",
                onUpdate: "cascade",
            }),
        title: t.varchar({ length: VOICE_TITLE_LENGTH }).notNull(),
        sourceFileId: t.varchar({ length: FILE_ID_LENGTH }),
        sourceFileUniqueId: t.varchar({ length: FILE_UNIQUE_ID_LENGTH }),
        sourceChatId: t.bigint({ mode: "number" }),
        sourceMessageId: t.integer(),
        requestedTrimStartMs: t.integer().notNull().default(0),
        requestedTrimEndMs: t.integer(),
        status: voiceSubmissionStatusEnum().notNull().default("uploading"),
        moderatorUserId: t.bigint({ mode: "number" }),
        rejectionReason: t.varchar({ length: 512 }),
        approvedVoiceId: t
            .varchar({ length: VOICE_ID_LENGTH })
            .references(() => voicesTable.voiceId, { onDelete: "set null" }),
        createdAt: t.timestamp({ withTimezone: true }).defaultNow().notNull(),
        updatedAt: t.timestamp({ withTimezone: true }).defaultNow().notNull(),
        finalizedAt: t.timestamp({ withTimezone: true }),
    }),
    (table) => [
        index("voice_submissions_submitter_created_idx").on(
            table.submitterUserId,
            table.createdAt.desc(),
        ),
        index("voice_submissions_status_created_idx").on(
            table.status,
            table.createdAt,
        ),
        index("voice_submissions_finalized_idx").on(table.finalizedAt),
    ],
);

export type InsertVoiceSubmission = typeof voiceSubmissionsTable.$inferInsert;
export type SelectVoiceSubmission = typeof voiceSubmissionsTable.$inferSelect;
