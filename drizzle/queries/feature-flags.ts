import { eq, not, sql } from "drizzle-orm";

import { db } from "../db.ts";
import { featureFlagsTable, type SelectFeatureFlag } from "../schema.ts";

const getFeatureFlagQuery = db
    .select({ status: featureFlagsTable.status })
    .from(featureFlagsTable)
    .where(eq(featureFlagsTable.name, sql.placeholder("name")))
    .prepare("get_feature_flag");

const toggleFeatureFlagQuery = db
    .insert(featureFlagsTable)
    .values({
        name: sql.placeholder("name"),
        status: true,
    })
    .onConflictDoUpdate({
        target: featureFlagsTable.name,
        set: { status: not(featureFlagsTable.status) },
    })
    .returning({ status: featureFlagsTable.status })
    .prepare("toggle_feature_flag");

export async function getFeatureFlag(name: SelectFeatureFlag["name"]) {
    const [featureFlag] = await getFeatureFlagQuery.execute({ name });

    return featureFlag?.status ?? null;
}

export async function toggleFeatureFlag(name: SelectFeatureFlag["name"]) {
    const [featureFlag] = await toggleFeatureFlagQuery.execute({ name });

    return featureFlag.status;
}
