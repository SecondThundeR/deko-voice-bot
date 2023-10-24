import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";
import { FeatureFlagSchema } from "@/src/schemas/featureFlag.ts";
import { featureFlagsCache } from "@/src/cache/featureFlags.ts";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].featureFlags;

export async function removeFeatureFlag(id: string) {
    const db = client.database(dbName);
    const featureFlagsCollection = db.collection<FeatureFlagSchema>(colName);

    const isDeleted = await featureFlagsCollection.deleteOne({ id }) > 0;
    if (isDeleted) {
        featureFlagsCache.delete(id);
    }

    return isDeleted;
}
