import { or, sql } from "drizzle-orm";

import { db } from "../db";
import { usersTable, voicesTable } from "../schema";
import type { FullUsersStats, FullVoicesStats } from "../types";

const basicStatsColumns = {
    allUsedUsers: sql<number>`cast(count(*) as int)`,
    allIgnoredUsers: sql<number>`cast(count(*) filter (where ${usersTable.isIgnored} = true) as int)`,
    allMAUUsers: sql<number>`cast(count(*) filter (where ${usersTable.isIgnored} = false and ${usersTable.lastUsedAt} is not null and ${usersTable.lastUsedAt} > (extract(epoch from (now() - interval '1 month')) * 1000)::bigint) as int)`,
    allInactiveUsers: sql<number>`cast(count(*) filter (where ${or(
        sql`${usersTable.isIgnored} = false and ${usersTable.lastUsedAt} is null`,
        sql`${usersTable.isIgnored} = false and ${usersTable.lastUsedAt} = 0`,
        sql`${usersTable.isIgnored} = false and ${usersTable.lastUsedAt} < (extract(epoch from (now() - interval '3 months')) * 1000)::bigint`,
    )}) as int)`,
    allUsedVoices: sql<number>`(
        select cast(coalesce(sum(${voicesTable.usesAmount}), 0) as int)
        from ${voicesTable}
    )`,
};

const mostUsedUsersStats = sql<FullUsersStats[]>`(
    select coalesce(jsonb_agg(to_jsonb(most_used_users)), '[]'::jsonb)
    from (
        select
            fullname,
            username,
            last_used_at as "lastUsedAt",
            uses_amount as "usesAmount"
        from users_table
        where is_ignored = false and uses_amount <> 0
        order by uses_amount desc
        limit 5
    ) most_used_users
)`;

const lastUsedUsersStats = sql<FullUsersStats[]>`(
    select coalesce(jsonb_agg(to_jsonb(last_used_users)), '[]'::jsonb)
    from (
        select
            fullname,
            username,
            last_used_at as "lastUsedAt",
            uses_amount as "usesAmount"
        from users_table
        where is_ignored = false and uses_amount <> 0
        order by coalesce(last_used_at, 0) desc
        limit 5
    ) last_used_users
)`;

const mostUsedVoicesStats = sql<FullVoicesStats[]>`(
    select coalesce(jsonb_agg(to_jsonb(most_used_voices)), '[]'::jsonb)
    from (
        select
            voice_title as "voiceTitle",
            uses_amount as "usesAmount"
        from voices_table
        where uses_amount <> 0
        order by uses_amount desc
        limit 5
    ) most_used_voices
)`;

export const getBasicStatsQuery = db
    .select(basicStatsColumns)
    .from(usersTable)
    .prepare("get_basic_stats");

export const getFullStatsQuery = db
    .select({
        ...basicStatsColumns,
        mostUsedUsersStats,
        lastUsedUsersStats,
        mostUsedVoicesStats,
    })
    .from(usersTable)
    .prepare("get_full_stats");
