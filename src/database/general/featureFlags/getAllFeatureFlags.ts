import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";

import type { FeatureFlagSchema } from "@/src/schemas/featureFlag.ts";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].featureFlags;

export async function getAllFeatureFlags() {
    const db = client.db(dbName);
    const featureFlagsCollection = db.collection<FeatureFlagSchema>(colName);
    const featureFlags = await featureFlagsCollection
        .find()
        .toArray();

    return featureFlags;
}
