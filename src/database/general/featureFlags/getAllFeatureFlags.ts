import { client } from "@/bot";

import { collectionNames, databaseNames } from "@/src/constants/database";

import type { FeatureFlagSchema } from "@/src/schemas/featureFlag";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].featureFlags;

export async function getAllFeatureFlags() {
    const db = client.db(dbName);
    const featureFlagsCollection = db.collection<FeatureFlagSchema>(colName);
    const featureFlags = await featureFlagsCollection.find().toArray();

    return featureFlags;
}
