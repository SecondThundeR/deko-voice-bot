import { and, desc, eq, ilike, sql } from "drizzle-orm";
import { db } from "../db";
import { getFeatureFlagQuery } from "../prepared/feature-flags";
import { getUserIgnoreStatusQuery } from "../prepared/users";
import { getUserFavoritesQuery } from "../prepared/users-favorites";
import {
    type SelectFeatureFlag,
    type SelectUser,
    type SelectUserFavorites,
    type SelectVoice,
    usersFavoritesTable,
    voicesTable,
} from "../schema";

export async function getFeatureFlag(name: SelectFeatureFlag["name"]) {
    const [featureFlag] = await getFeatureFlagQuery.execute({ name });

    if (!featureFlag) {
        return null;
    }

    return featureFlag.status;
}

export async function getVoicesCount(query?: SelectVoice["voiceTitle"]) {
    return db.$count(
        voicesTable,
        query ? ilike(voicesTable.voiceTitle, `%${query}%`) : undefined,
    );
}

type GetVoicesPageOptions = {
    favoritesUserId?: SelectUser["userId"];
    limit: number;
    offset: number;
    orderFavoritesFirst?: boolean;
    query?: SelectVoice["voiceTitle"];
};

export async function getVoicesPage({
    favoritesUserId,
    limit,
    offset,
    orderFavoritesFirst = false,
    query,
}: GetVoicesPageOptions) {
    const filters = query
        ? ilike(voicesTable.voiceTitle, `%${query}%`)
        : undefined;

    if (!favoritesUserId) {
        return db
            .select({
                voiceId: voicesTable.voiceId,
                voiceTitle: voicesTable.voiceTitle,
                fileId: voicesTable.fileId,
                fileUniqueId: voicesTable.fileUniqueId,
                usesAmount: voicesTable.usesAmount,
                isFavorite: sql<boolean>`false`,
            })
            .from(voicesTable)
            .where(filters)
            .orderBy(voicesTable.voiceTitle)
            .limit(limit)
            .offset(offset);
    }

    const queryBuilder = db
        .select({
            voiceId: voicesTable.voiceId,
            voiceTitle: voicesTable.voiceTitle,
            fileId: voicesTable.fileId,
            fileUniqueId: voicesTable.fileUniqueId,
            usesAmount: voicesTable.usesAmount,
            isFavorite: sql<boolean>`${usersFavoritesTable.voiceId} is not null`,
        })
        .from(voicesTable)
        .leftJoin(
            usersFavoritesTable,
            and(
                eq(usersFavoritesTable.voiceId, voicesTable.voiceId),
                eq(usersFavoritesTable.userId, favoritesUserId),
            ),
        )
        .where(filters)
        .$dynamic();

    if (orderFavoritesFirst) {
        queryBuilder.orderBy(
            desc(sql`${usersFavoritesTable.voiceId} is not null`),
            voicesTable.voiceTitle,
        );
    } else {
        queryBuilder.orderBy(voicesTable.voiceTitle);
    }

    return queryBuilder.limit(limit).offset(offset);
}

export async function isVoiceIdUnique(voiceId: SelectVoice["voiceId"]) {
    return (
        (await db.$count(voicesTable, eq(voicesTable.voiceId, voiceId))) === 0
    );
}

export async function getUserIsIgnoredStatus(userId: SelectUser["userId"]) {
    const [userIgnoreStatus] = await getUserIgnoreStatusQuery.execute({
        userId,
    });

    if (!userIgnoreStatus) {
        return null;
    }

    return userIgnoreStatus.isIgnored;
}

export async function getUserFavorites(userId: SelectUserFavorites["userId"]) {
    const favoritesData = await getUserFavoritesQuery.execute({ userId });

    return favoritesData.map(({ voiceId }) => voiceId);
}
