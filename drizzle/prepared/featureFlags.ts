import { eq, not, sql } from "drizzle-orm";

import { db } from "../db";
import { featureFlagsTable } from "../schema";

export const getAllFeatureFlagsQuery = db
    .select()
    .from(featureFlagsTable)
    .prepare("get_all_feature_flags");

export const getFeatureFlagQuery = db
    .select({
        status: featureFlagsTable.status,
    })
    .from(featureFlagsTable)
    .where(eq(featureFlagsTable.name, sql.placeholder("name")))
    .prepare("get_feature_flag");

export const toggleFeatureFlagQuery = db
    .update(featureFlagsTable)
    .set({
        status: not(featureFlagsTable.status),
    })
    .where(eq(featureFlagsTable.name, sql.placeholder("name")))
    .returning({ status: featureFlagsTable.status })
    .prepare("toggle_feature_flag");
