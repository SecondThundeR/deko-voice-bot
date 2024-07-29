import { client } from "@/bot";

import { collectionNames, databaseNames } from "@/src/constants/database";

import {
    getCachedFeatureFlag,
    updateCachedFeatureFlag,
} from "@/src/helpers/cache";

import type { FeatureFlagSchema } from "@/src/schemas/featureFlag";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].featureFlags;

export async function getFeatureFlag(id: string) {
    const cachedFeatureFlagStatus = getCachedFeatureFlag(id);
    if (cachedFeatureFlagStatus !== undefined) {
        return cachedFeatureFlagStatus;
    }

    const db = client.db(dbName);
    const featureFlagsCollection = db.collection<FeatureFlagSchema>(colName);
    const featureFlag = await featureFlagsCollection.find({ id }).toArray();

    if (!featureFlag) return false;

    const featureFlagData = featureFlag.at(0);
    if (!featureFlagData) return false;

    const featureFlagStatus = featureFlagData.status;

    updateCachedFeatureFlag(id, featureFlagStatus);
    return featureFlagStatus;
}
