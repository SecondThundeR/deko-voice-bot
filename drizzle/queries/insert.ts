import { sql } from "drizzle-orm";

import { db } from "../db";
import {
    usersFavoritesTable,
    usersTable,
    voicesTable,
    type InsertUser,
    type InsertUserFavorites,
    type InsertVoice,
} from "../schema";

// Voices
export async function addRegularVoice(
    data: Omit<InsertVoice, "url" | "usesAmount">,
) {
    const insertedData = await db
        .insert(voicesTable)
        .values(data)
        .onConflictDoNothing()
        .returning();

    return insertedData.length > 0;
}

export async function addRemoteVoice(
    data: Omit<InsertVoice, "fileId" | "usesAmount">,
) {
    const insertedData = await db
        .insert(voicesTable)
        .values(data)
        .onConflictDoNothing()
        .returning();

    return insertedData.length > 0;
}

// Users
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

// Users Favorites
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
