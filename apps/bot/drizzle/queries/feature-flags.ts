import { eq, not } from "drizzle-orm";

import { db } from "../db.ts";
import { featureFlagsTable, type SelectFeatureFlag } from "../schema.ts";

export async function getFeatureFlag(name: SelectFeatureFlag["name"]) {
    const [featureFlag] = await db
        .select({ status: featureFlagsTable.status })
        .from(featureFlagsTable)
        .where(eq(featureFlagsTable.name, name));

    return featureFlag?.status ?? null;
}

export async function toggleFeatureFlag(name: SelectFeatureFlag["name"]) {
    const [featureFlag] = await db
        .insert(featureFlagsTable)
        .values({ name, status: true })
        .onConflictDoUpdate({
            target: featureFlagsTable.name,
            set: { status: not(featureFlagsTable.status) },
        })
        .returning({ status: featureFlagsTable.status });

    return featureFlag.status;
}
