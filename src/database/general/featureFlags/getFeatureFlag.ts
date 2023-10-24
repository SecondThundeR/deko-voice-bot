import { client } from "@/bot.ts";

import { collectionNames, databaseNames } from "@/src/constants/database.ts";
import { FeatureFlagSchema } from "@/src/schemas/featureFlag.ts";

const dbName = databaseNames.general;
const colName = collectionNames[dbName].featureFlags;

export async function getFeatureFlag(id: string) {
    const db = client.database(dbName);
    const featureFlagsCollection = db.collection<FeatureFlagSchema>(colName);
    const featureFlag = await featureFlagsCollection.find({ id }).toArray();

    if (!featureFlag.length) {
        throw new Error("Failed to find feature flag by ID: " + id);
    }

    return featureFlag[0];
}
