import { client } from "@/bot.ts";

import { FeatureFlagSchema } from "@/src/schemas/featureFlag.ts";

export async function listAllFeatureFlags() {
    const db = client.database("general");
    const featureFlagsCollection = db.collection<FeatureFlagSchema>(
        "featureFlags",
    );
    const featureFlags = await featureFlagsCollection.find().toArray();

    return featureFlags;
}
