import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";
import { FeatureFlagSchema } from "@/src/schemas/featureFlag.ts";
import { featureFlagsCache } from "@/src/cache/featureFlags.ts";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].featureFlags;

export async function getFeatureFlag(id: string) {
    if (featureFlagsCache.has(id)) {
        return featureFlagsCache.get(id)!;
    }

    const db = client.database(dbName);
    const featureFlagsCollection = db.collection<FeatureFlagSchema>(colName);
    const featureFlag = await featureFlagsCollection.find({ id }).toArray();

    if (!featureFlag.length) {
        throw new Error("Failed to find feature flag by ID: " + id);
    }

    const featureFlagStatus = featureFlag[0].status;
    featureFlagsCache.set(id, featureFlagStatus);

    return featureFlagStatus;
}
