import { pgEnum, pgTable, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import {
    FEATURE_FLAG_NAME_LENGTH,
    FILE_ID_LENGTH,
    FULLNAME_LENGTH,
    USERNAME_LENGTH,
    VOICE_ID_LENGTH,
    FILE_UNIQUE_ID_LENGTH,
    VOICE_TITLE_LENGTH,
} from "./constraints";

export const featureFlagsTable = pgTable("feature_flags_table", (t) => ({
    name: t.varchar({ length: FEATURE_FLAG_NAME_LENGTH }).primaryKey(),
    status: t.boolean().notNull().default(false),
}));

export type InsertFeatureFlag = typeof featureFlagsTable.$inferInsert;
export type SelectFeatureFlag = typeof featureFlagsTable.$inferSelect;

export const voicesTable = pgTable("voices_table", (t) => ({
    voiceId: t.varchar({ length: VOICE_ID_LENGTH }).primaryKey(),
    voiceTitle: t
        .varchar({
            length: VOICE_TITLE_LENGTH,
        })
        .notNull(),
    fileId: t.varchar({ length: FILE_ID_LENGTH }),
    fileUniqueId: t
        .varchar({
            length: FILE_UNIQUE_ID_LENGTH,
        })
        .notNull(),
    usesAmount: t.integer().notNull().default(0),
}));

export const voicesRelations = relations(voicesTable, ({ many }) => ({
    usersFavoritesTable: many(usersFavoritesTable),
}));

export type InsertVoice = typeof voicesTable.$inferInsert;
export type SelectVoice = typeof voicesTable.$inferSelect;

export const usersTable = pgTable("users_table", (t) => ({
    userId: t.bigint({ mode: "number" }).primaryKey(),
    fullname: t.varchar({ length: FULLNAME_LENGTH }),
    username: t.varchar({ length: USERNAME_LENGTH }),
    usesAmount: t.integer().default(0),
    // Using `bigint` with `Date.now` timestamp here instead of `date/timestamp`
    // from drizzle-orm/pg-core for backwards compatibility after MongoDB migration
    lastUsedAt: t.bigint({ mode: "number" }).$onUpdate(() => Date.now()),
    isIgnored: t.boolean().notNull().default(false),
}));

export const usersRelations = relations(usersTable, ({ many }) => ({
    usersFavoritesTable: many(usersFavoritesTable),
}));

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;

export const usersFavoritesTable = pgTable(
    "users_favorites_table",
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
export type SelectUserFavorites = typeof usersFavoritesTable.$inferSelect;

export const usersFavoritesTableRelations = relations(
    usersFavoritesTable,
    ({ one }) => ({
        voice: one(voicesTable, {
            fields: [usersFavoritesTable.voiceId],
            references: [voicesTable.voiceId],
        }),
        user: one(usersTable, {
            fields: [usersFavoritesTable.userId],
            references: [usersTable.userId],
        }),
    }),
);

export const paymentStatusEnum = pgEnum("payment_status", ["paid", "refunded"]);

export const paymentsTable = pgTable("payments", (t) => ({
    telegramPaymentChargeId: t.text().primaryKey(),
    invoicePayload: t.text().notNull(),
    userId: t.bigint({ mode: "number" }).notNull(),
    amount: t.integer().notNull(),
    paidAt: t.timestamp().defaultNow().notNull(),
    status: paymentStatusEnum().default("paid").notNull(),
}));
