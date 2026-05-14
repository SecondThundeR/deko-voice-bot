import { and, desc, eq, sql } from "drizzle-orm";
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

const VOICE_TITLE_SIMILARITY_THRESHOLD = 0.2;

export async function getFeatureFlag(name: SelectFeatureFlag["name"]) {
    const [featureFlag] = await getFeatureFlagQuery.execute({ name });

    if (!featureFlag) {
        return null;
    }

    return featureFlag.status;
}

export async function getVoicesCount() {
    return db.$count(voicesTable);
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
        ? sql`(
            ${voicesTable.voiceTitle} ilike ${`%${query}%`}
            or word_similarity(${query}, ${voicesTable.voiceTitle}) > ${VOICE_TITLE_SIMILARITY_THRESHOLD}
        )`
        : undefined;

    const similarityOrder = query
        ? desc(sql`word_similarity(${query}, ${voicesTable.voiceTitle})`)
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
            .orderBy(
                ...(similarityOrder ? [similarityOrder] : []),
                voicesTable.voiceTitle,
            )
            .limit(limit)
            .offset(offset);
    }

    return db
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
        .orderBy(
            ...(orderFavoritesFirst
                ? [desc(sql`${usersFavoritesTable.voiceId} is not null`)]
                : []),
            ...(similarityOrder ? [similarityOrder] : []),
            voicesTable.voiceTitle,
        )
        .limit(limit)
        .offset(offset);
}

export async function isVoiceIdUnique(voiceId: SelectVoice["voiceId"]) {
    const [existing] = await db
        .select({ voiceId: voicesTable.voiceId })
        .from(voicesTable)
        .where(eq(voicesTable.voiceId, voiceId))
        .limit(1);

    return !existing;
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
