import { client } from "@/bot";

import { collectionNames, databaseNames } from "@/src/constants/database";

import { deleteCachedFeatureFlag } from "@/src/helpers/cache";

import type { FeatureFlagSchema } from "@/src/schemas/featureFlag";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].featureFlags;

export async function removeFeatureFlag(id: string) {
    const db = client.db(dbName);
    const featureFlagsCollection = db.collection<FeatureFlagSchema>(colName);
    const isDeleted =
        (await featureFlagsCollection.deleteOne({ id })).deletedCount > 0;

    if (isDeleted) {
        deleteCachedFeatureFlag(id);
    }

    return isDeleted;
}
