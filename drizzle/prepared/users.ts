import { and, eq, sql } from "drizzle-orm";

import { db } from "../db.ts";
import { usersTable } from "../schema.ts";

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
