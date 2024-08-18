import { eq, and, sql } from "drizzle-orm";

import { db } from "../db";
import { usersFavoritesTable } from "../schema";

export const getUserFavoritesQuery = db
    .select({
        voiceId: usersFavoritesTable.voiceId,
    })
    .from(usersFavoritesTable)
    .where(eq(usersFavoritesTable.userId, sql.placeholder("userId")))
    .prepare("get_user_favorites");

export const deleteUserFavoriteQuery = db
    .delete(usersFavoritesTable)
    .where(
        and(
            eq(usersFavoritesTable.userId, sql.placeholder("userId")),
            eq(usersFavoritesTable.voiceId, sql.placeholder("voiceId")),
        ),
    )
    .prepare("delete_user_favorite");

export const deleteAllUserFavoritesQuery = db
    .delete(usersFavoritesTable)
    .where(eq(usersFavoritesTable.userId, sql.placeholder("userId")))
    .prepare("delete_all_user_favorites");
