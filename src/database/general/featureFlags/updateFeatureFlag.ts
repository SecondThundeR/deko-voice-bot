import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";

import { updateCachedFeatureFlag } from "@/src/helpers/cache.ts";

import type { FeatureFlagSchema } from "@/src/schemas/featureFlag.ts";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].featureFlags;

export async function updateFeatureFlag(
    id: string,
    newStatus: boolean,
) {
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
