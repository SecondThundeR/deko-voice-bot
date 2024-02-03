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

    const db = client.db(dbName);
    const featureFlagsCollection = db.collection<FeatureFlagSchema>(colName);
    const featureFlag = await featureFlagsCollection
        .find({ id })
        .toArray();

    if (!featureFlag) return false;

    const featureFlagData = featureFlag.at(0);
    if (!featureFlagData) return false;

    const featureFlagStatus = featureFlagData.status;

    updateCachedFeatureFlag(id, featureFlagStatus);
    return featureFlagStatus;
}
