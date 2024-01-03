import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";

import {
    getCachedFeatureFlag,
    updateCachedFeatureFlag,
} from "@/src/helpers/cache.ts";

import type { FeatureFlagSchema } from "@/src/schemas/featureFlag.ts";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].featureFlags;

export async function getFeatureFlag(id: string) {
    const cachedFeatureFlagStatus = getCachedFeatureFlag(id);
    if (cachedFeatureFlagStatus !== undefined) {
        return cachedFeatureFlagStatus;
    }

    const db = client.database(dbName);
    const featureFlagsCollection = db.collection<FeatureFlagSchema>(colName);
    const featureFlag = await featureFlagsCollection
        .find({ id })
        .toArray();

    if (!featureFlag) {
        throw new Error("Failed to get feature flag by ID: " + id);
    }

    const featureFlagData = featureFlag.at(0);
    if (!featureFlagData) {
        throw new Error("Failed to extract feature flag data for ID: " + id);
    }

    const featureFlagStatus = featureFlagData.status;

    updateCachedFeatureFlag(id, featureFlagStatus);
    return featureFlagStatus;
}
