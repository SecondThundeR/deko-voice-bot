import {
    integer,
    pgTable,
    boolean,
    bigint,
    varchar,
} from "drizzle-orm/pg-core";

export const featureFlagsTable = pgTable("feature_flags_table", {
    name: varchar("name", { length: 255 }).primaryKey(),
    status: boolean("status").notNull().default(false),
});

export type InsertFeatureFlag = typeof featureFlagsTable.$inferInsert;
export type SelectFeatureFlag = typeof featureFlagsTable.$inferSelect;

export const voicesTable = pgTable("voices_table", {
    voiceId: varchar("voice_id", { length: 64 }).primaryKey(),
    voiceTitle: varchar("voice_title", { length: 128 }).notNull(),
    url: varchar("url"),
    fileId: varchar("file_id", { length: 128 }),
    voiceUniqueId: varchar("voice_inique_id", { length: 32 }).notNull(),
    usesAmount: integer("uses_amount").notNull().default(0),
});

export type InsertVoice = typeof voicesTable.$inferInsert;
export type SelectVoice = typeof voicesTable.$inferSelect;

export const usersTable = pgTable("users_table", {
    userId: bigint("user_id", { mode: "number" }).primaryKey(),
    fullname: varchar("fullname", { length: 128 }),
    username: varchar("username", { length: 32 }),
    usesAmount: integer("uses_amount").default(0),
    lastUsedAt: bigint("last_used_at", { mode: "number" }).$onUpdate(() =>
        Date.now(),
    ),
    isIgnored: boolean("is_ignored").notNull().default(false),
});

export type InsertUser = typeof usersTable.$inferInsert;
export type SelectUser = typeof usersTable.$inferSelect;

export const usersFavoritesTable = pgTable("users_favorites_table", {
    userId: bigint("user_id", { mode: "number" })
        .notNull()
        .references(() => usersTable.userId, { onDelete: "cascade" }),
    voiceId: varchar("voice_id", { length: 64 })
        .notNull()
        .references(() => voicesTable.voiceId, { onDelete: "cascade" }),
});

export type InsertUserFavorites = typeof usersFavoritesTable.$inferInsert;
export type SelectUserFavorites = typeof usersFavoritesTable.$inferSelect;
