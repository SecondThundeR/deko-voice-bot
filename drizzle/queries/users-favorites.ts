import { and, eq } from "drizzle-orm";

import { db } from "../db.ts";
import { type InsertUserFavorites, usersFavoritesTable } from "../schema.ts";

export async function addUserFavorite(favorite: InsertUserFavorites) {
    const [insertedFavorite] = await db
        .insert(usersFavoritesTable)
        .values(favorite)
        .onConflictDoNothing()
        .returning({ voiceId: usersFavoritesTable.voiceId });

    return !!insertedFavorite;
}

export async function deleteUserFavorite({
    userId,
    voiceId,
}: InsertUserFavorites) {
    const [deletedFavorite] = await db
        .delete(usersFavoritesTable)
        .where(
            and(
                eq(usersFavoritesTable.userId, userId),
                eq(usersFavoritesTable.voiceId, voiceId),
            ),
        )
        .returning({ voiceId: usersFavoritesTable.voiceId });

    return !!deletedFavorite;
}
