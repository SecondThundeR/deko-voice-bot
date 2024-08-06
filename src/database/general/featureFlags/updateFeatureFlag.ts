import { client } from "@/bot";

import { collectionNames, databaseNames } from "@/src/constants/database";

import { updateCachedFeatureFlag } from "@/src/helpers/cache";

import type { FeatureFlagSchema } from "@/src/schemas/featureFlag";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].featureFlags;

export async function updateFeatureFlag(id: string, newStatus: boolean) {
    const db = client.db(dbName);
    const featureFlagsCollection = db.collection<FeatureFlagSchema>(colName);

    await featureFlagsCollection.updateOne(
        { id },
        {
            $set: {
                status: newStatus,
            },
        },
        { upsert: true },
    );

    updateCachedFeatureFlag(id, newStatus);
    return newStatus;
}
