import { eq, and, sql } from "drizzle-orm";

import { db } from "../db";
import { usersTable } from "../schema";

export const getUsersBasicStatsQuery = db
    .select({ lastUsedAt: usersTable.lastUsedAt })
    .from(usersTable)
    .where(eq(usersTable.isIgnored, false))
    .prepare("users_basic_stats");

export const usersFullStatsQuery = db
    .select({
        userId: usersTable.userId,
        fullname: usersTable.fullname,
        username: usersTable.username,
        lastUsedAt: usersTable.lastUsedAt,
        usesAmount: usersTable.usesAmount,
    })
    .from(usersTable)
    .where(eq(usersTable.isIgnored, false))
    .prepare("users_full_stats");

export const getUserDataQuery = db
    .select({
        userId: usersTable.userId,
        fullname: usersTable.fullname,
        username: usersTable.username,
        lastUsedAt: usersTable.lastUsedAt,
        usesAmount: usersTable.usesAmount,
    })
    .from(usersTable)
    .where(
        and(
            eq(usersTable.userId, sql.placeholder("userId")),
            eq(usersTable.isIgnored, false),
        ),
    )
    .prepare("user_data");

export const getUserIgnoreStatusQuery = db
    .select({ isIgnored: usersTable.isIgnored })
    .from(usersTable)
    .where(eq(usersTable.userId, sql.placeholder("userId")))
    .prepare("user_ignore_status");
