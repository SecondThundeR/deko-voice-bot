import { client } from "@/bot";

import { COLLECTION_NAMES, DATABASE_NAMES } from "@/src/constants/database";

import { updateCachedFeatureFlag } from "@/src/helpers/cache";

import type { FeatureFlagSchema } from "@/src/schemas/featureFlag";

const dbName = DATABASE_NAMES.general;
const colName = COLLECTION_NAMES[dbName].featureFlags;

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
