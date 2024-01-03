import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";

import { deleteCachedFeatureFlag } from "@/src/helpers/cache.ts";

import type { FeatureFlagSchema } from "@/src/schemas/featureFlag.ts";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].featureFlags;

export async function removeFeatureFlag(id: string) {
    const db = client.database(dbName);
    const featureFlagsCollection = db.collection<FeatureFlagSchema>(colName);
    const isDeleted = await featureFlagsCollection
        .deleteOne({ id }) > 0;

    if (isDeleted) {
        deleteCachedFeatureFlag(id);
    }

    return isDeleted;
}
