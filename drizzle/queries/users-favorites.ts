import { and, eq, sql } from "drizzle-orm";

import { db } from "../db.ts";
import {
    type InsertUserFavorites,
    usersFavoritesTable,
    usersTable,
} from "../schema.ts";

export async function addUserFavorite(favorite: InsertUserFavorites) {
    const rows = await db.execute<{ voice_id: string }>(sql`
        insert into ${usersFavoritesTable} (user_id, voice_id)
        select ${favorite.userId}::bigint, ${favorite.voiceId}
        from ${usersTable}
        where ${usersTable.userId} = ${favorite.userId}::bigint
        on conflict do nothing
        returning voice_id
    `);

    return rows.length === 1;
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
