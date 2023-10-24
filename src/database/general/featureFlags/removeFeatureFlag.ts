import { client } from "@/bot.ts";

import { FeatureFlagSchema } from "@/src/schemas/featureFlag.ts";

export async function removeFeatureFlag(id: string) {
    const db = client.database("general");
    const featureFlagsCollection = db.collection<FeatureFlagSchema>(
        "featureFlags",
    );
    const deleteCount = await featureFlagsCollection.deleteOne({ id });

    return deleteCount > 0;
}
