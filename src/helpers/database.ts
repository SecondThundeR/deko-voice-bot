import { getFeatureFlag } from "@/src/database/general/featureFlags/getFeatureFlag.ts";
import { updateFeatureFlag } from "@/src/database/general/featureFlags/updateFeatureFlag.ts";

/**
 * Toggles feature flag status in database and in cache
 *
 * @param id ID of feature flag to toggle
 * @returns New feature flag status
 */
export async function toggleFeatureFlag(id: string) {
    const featureFlagStatus = await getFeatureFlag(id);
    const newFeatureFlagStatus = !featureFlagStatus;

    await updateFeatureFlag(id, newFeatureFlagStatus);

    return newFeatureFlagStatus;
}
