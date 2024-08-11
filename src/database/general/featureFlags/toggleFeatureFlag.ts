import { getFeatureFlag } from "./getFeatureFlag";
import { updateFeatureFlag } from "./updateFeatureFlag";

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
