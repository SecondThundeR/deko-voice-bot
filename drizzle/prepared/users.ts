import { eq, and, sql } from "drizzle-orm";

import { db } from "../db";
import { usersTable } from "../schema";

export const getAllUsersQuery = db
    .select()
    .from(usersTable)
    .prepare("get_all_users");

export const getUsersBasicStatsQuery = db
    .select({ lastUsedAt: usersTable.lastUsedAt })
    .from(usersTable)
    .where(eq(usersTable.isIgnored, false))
    .prepare("get_users_basic_stats");

export const getUsersFullStatsQuery = db
    .select({
        fullname: usersTable.fullname,
        username: usersTable.username,
        lastUsedAt: usersTable.lastUsedAt,
        usesAmount: usersTable.usesAmount,
    })
    .from(usersTable)
    .where(eq(usersTable.isIgnored, false))
    .prepare("get_users_full_stats");

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
    .prepare("get_user_data");

export const getUserIgnoreStatusQuery = db
    .select({ isIgnored: usersTable.isIgnored })
    .from(usersTable)
    .where(eq(usersTable.userId, sql.placeholder("userId")))
    .prepare("get_user_ignore_status");
