import { client } from "@/bot.ts";

import { FeatureFlagSchema } from "@/src/schemas/featureFlag.ts";

export async function toggleFeatureFlag(id: string) {
    const db = client.database("general");
    const featureFlagsCollection = db.collection<FeatureFlagSchema>(
        "featureFlags",
    );

    const featureFlag = await featureFlagsCollection.find({ id }).toArray();
    if (!featureFlag.length) {
        throw new Error("Failed to find feature flag by ID: " + id);
    }
    const updatedFeatureFlag = {
        ...featureFlag[0],
        status: !featureFlag[0].status,
    };

    await featureFlagsCollection.updateOne(
        { id },
        {
            $set: {
                status: updatedFeatureFlag.status,
            },
        },
    );

    return updatedFeatureFlag;
}
