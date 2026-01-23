import { eq, ilike } from "drizzle-orm";

import { getFeatureFlagQuery } from "../prepared/featureFlags";
import { getUserIgnoreStatusQuery } from "../prepared/users";
import { getUserFavoritesQuery } from "../prepared/usersFavorites";

import { db } from "../db";
import {
    voicesTable,
    usersTable,
    type SelectUser,
    type SelectUserFavorites,
    type SelectVoice,
    type SelectFeatureFlag,
} from "../schema";

export async function getFeatureFlag(name: SelectFeatureFlag["name"]) {
    const [featureFlag] = await getFeatureFlagQuery.execute({ name });

    if (!featureFlag) return null;

    return featureFlag.status;
}

export async function getVoicesCount(query?: SelectVoice["voiceTitle"]) {
    return db.$count(
        voicesTable,
        query ? ilike(voicesTable.voiceTitle, `%${query}%`) : undefined,
    );
}

export async function getVoices(query?: SelectVoice["voiceTitle"]) {
    return db
        .select()
        .from(voicesTable)
        .where(query ? ilike(voicesTable.voiceTitle, `%${query}%`) : undefined)
        .orderBy(voicesTable.voiceTitle);
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

    if (!userIgnoreStatus) return null;

    return userIgnoreStatus.isIgnored;
}

export async function isUserExists(userId: SelectUser["userId"]) {
    return (await db.$count(usersTable, eq(usersTable.userId, userId))) !== 0;
}

export async function getUserFavorites(userId: SelectUserFavorites["userId"]) {
    const favoritesData = await getUserFavoritesQuery.execute({ userId });

    return favoritesData.map(({ voiceId }) => voiceId);
}
