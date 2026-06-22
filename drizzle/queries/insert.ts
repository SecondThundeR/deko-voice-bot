import { sql } from "drizzle-orm";

import { db } from "../db.ts";
import {
    type InsertUser,
    type InsertUserFavorites,
    type InsertVoice,
    usersFavoritesTable,
    usersTable,
    voicesTable,
} from "../schema.ts";

export async function addRegularVoice(data: Omit<InsertVoice, "usesAmount">) {
    const insertedData = await db
        .insert(voicesTable)
        .values(data)
        .onConflictDoNothing()
        .returning();

    return insertedData.length > 0;
}

export async function updateUserData({
    userId,
    fullname,
    username,
}: Omit<InsertUser, "isIgnored" | "usesAmount" | "lastUsedAt">) {
    const insertedData = await db
        .insert(usersTable)
        .values({
            userId,
            fullname,
            username,
            usesAmount: 1,
        })
        .onConflictDoUpdate({
            target: usersTable.userId,
            set: {
                fullname,
                username,
                usesAmount: sql`${usersTable.usesAmount} + 1`,
            },
        })
        .returning();

    return insertedData.length > 0;
}

export async function addUserFavorite({
    userId,
    voiceId,
}: InsertUserFavorites) {
    const insertedData = await db
        .insert(usersFavoritesTable)
        .values({ userId, voiceId })
        .onConflictDoNothing()
        .returning();

    return insertedData.length > 0;
}
