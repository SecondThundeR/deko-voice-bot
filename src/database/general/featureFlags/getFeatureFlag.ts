import { client } from "@/bot.ts";

import { FeatureFlagSchema } from "@/src/schemas/featureFlag.ts";

export async function getFeatureFlag(id: string) {
    const db = client.database("general");
    const featureFlagsCollection = db.collection<FeatureFlagSchema>(
        "featureFlags",
    );
    const featureFlag = await featureFlagsCollection.find({ id }).toArray();

    if (!featureFlag.length) {
        throw new Error("Failed to find feature flag by ID: " + id);
    }

    return featureFlag[0];
}
