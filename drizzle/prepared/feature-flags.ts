import { eq, not, sql } from "drizzle-orm";

import { db } from "../db.ts";
import { featureFlagsTable } from "../schema.ts";

export const getFeatureFlagQuery = db
    .select({
        status: featureFlagsTable.status,
    })
    .from(featureFlagsTable)
    .where(eq(featureFlagsTable.name, sql.placeholder("name")))
    .prepare("get_feature_flag");

export const toggleFeatureFlagQuery = db
    .insert(featureFlagsTable)
    .values({
        name: sql.placeholder("name"),
        status: true,
    })
    .onConflictDoUpdate({
        target: featureFlagsTable.name,
        set: {
            status: not(featureFlagsTable.status),
        },
    })
    .returning({ status: featureFlagsTable.status })
    .prepare("toggle_feature_flag");
