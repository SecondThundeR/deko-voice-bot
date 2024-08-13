import { count, ilike } from "drizzle-orm";

import { db } from "../db";
import {
    voicesTable,
    type SelectUser,
    type SelectUserFavorites,
    type SelectVoice,
    type SelectFeatureFlag,
} from "../schema";

import { getUserIgnoreStatusQuery } from "../prepared/users";
import { getUserFavoritesQuery } from "../prepared/usersFavorites";
import { getFeatureFlagQuery } from "../prepared/featureFlags";

// Feature Flags
export async function getFeatureFlag(name: SelectFeatureFlag["name"]) {
    const [featureFlag] = await getFeatureFlagQuery.execute({ name });

    if (!featureFlag) return null;

    return featureFlag.status;
}

// Voices
export async function getVoicesCount(query?: SelectVoice["voiceTitle"]) {
    const [voicesCount] = await db
        .select({ count: count() })
        .from(voicesTable)
        .where(query ? ilike(voicesTable.voiceTitle, `%${query}%`) : undefined);

    return voicesCount.count;
}

export async function getVoices(query?: SelectVoice["voiceTitle"]) {
    return await db
        .select()
        .from(voicesTable)
        .where(query ? ilike(voicesTable.voiceTitle, `%${query}%`) : undefined);
}

// Users
export async function getUserIsIgnoredStatus(userId: SelectUser["userId"]) {
    const [userIgnoreStatus] = await getUserIgnoreStatusQuery.execute({
        userId,
    });

    if (!userIgnoreStatus) return null;

    return userIgnoreStatus.isIgnored;
}

// Users Favorites
export async function getUserFavorites(userId: SelectUserFavorites["userId"]) {
    const favoritesData = await getUserFavoritesQuery.execute({ userId });

    return favoritesData.map(({ voiceId }) => voiceId);
}
