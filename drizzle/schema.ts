import {
    integer,
    pgTable,
    boolean,
    bigint,
    varchar,
    primaryKey,
} from "drizzle-orm/pg-core";
import {
    FEATURE_FLAG_NAME_LENGTH,
    FILE_ID_LENGTH,
    FULLNAME_LENGTH,
    USERNAME_LENGTH,
    VOICE_ID_LENGTH,
    FILE_UNIQUE_ID_LENGTH,
    VOICE_TITLE_LENGTH,
} from "./constraints";
import { relations } from "drizzle-orm";

export const featureFlagsTable = pgTable("feature_flags_table", {
    name: varchar("name", { length: FEATURE_FLAG_NAME_LENGTH }).primaryKey(),
    status: boolean("status").notNull().default(false),
});

export type InsertFeatureFlag = typeof featureFlagsTable.$inferInsert;
export type SelectFeatureFlag = typeof featureFlagsTable.$inferSelect;

export const voicesTable = pgTable("voices_table", {
    voiceId: varchar("voice_id", { length: VOICE_ID_LENGTH }).primaryKey(),
    voiceTitle: varchar("voice_title", {
        length: VOICE_TITLE_LENGTH,
    }).notNull(),
    url: varchar("url"),
    fileId: varchar("file_id", { length: FILE_ID_LENGTH }),
    fileUniqueId: varchar("file_inique_id", {
        length: FILE_UNIQUE_ID_LENGTH,
    }).notNull(),
    usesAmount: integer("uses_amount").notNull().default(0),
});

export const voicesRelations = relations(voicesTable, ({ many }) => ({
    usersFavoritesTable: many(usersFavoritesTable),
}));

export type InsertVoice = typeof voicesTable.$inferInsert;
export type SelectVoice = typeof voicesTable.$inferSelect;

export const usersTable = pgTable("users_table", {
    userId: bigint("user_id", { mode: "number" }).primaryKey(),
    fullname: varchar("fullname", { length: FULLNAME_LENGTH }),
    username: varchar("username", { length: USERNAME_LENGTH }),
    usesAmount: integer("uses_amount").default(0),
    // Using `bigint` with `Date.now` timestamp here instead of `date/timestamp`
    // from drizzle-orm/pg-core for backwards compatibility after MongoDB migration
    lastUsedAt: bigint("last_used_at", { mode: "number" }).$onUpdate(() =>
        Date.now(),
    ),
    isIgnored: boolean("is_ignored").notNull().default(false),
});

export const usersRelations = relations(usersTable, ({ many }) => ({
    usersFavoritesTable: many(usersFavoritesTable),
}));

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;

export const usersFavoritesTable = pgTable(
    "users_favorites_table",
    {
        userId: bigint("user_id", { mode: "number" })
            .notNull()
            .references(() => usersTable.userId, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
        voiceId: varchar("voice_id", { length: VOICE_ID_LENGTH })
            .notNull()
            .references(() => voicesTable.voiceId, {
                onDelete: "cascade",
                onUpdate: "cascade",
            }),
    },
    ({ userId, voiceId }) => ({
        pk: primaryKey({ columns: [userId, voiceId] }),
    }),
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
