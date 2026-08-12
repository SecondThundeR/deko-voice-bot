import { sql } from "drizzle-orm";

import { db } from "../db.ts";
import {
    type SelectUser,
    type SelectVoice,
    usersTable,
    voicesTable,
} from "../schema.ts";

export type BasicUsersStats = {
    allUsedUsers: number;
    allIgnoredUsers: number;
    allMAUUsers: number;
    allInactiveUsers: number;
};
export type BasicVoicesStats = {
    allUsedVoices: number;
};
export type BasicStats = BasicUsersStats & BasicVoicesStats;

export type FullUsersStats = Omit<SelectUser, "isIgnored" | "userId">;
export type FullVoicesStats = Pick<SelectVoice, "usesAmount" | "voiceTitle">;

export type FullStats = BasicStats & {
    mostUsedUsersStats: FullUsersStats[];
    lastUsedUsersStats: FullUsersStats[];
    mostUsedVoicesStats: FullVoicesStats[];
};

const oneMonthAgoMs = sql`(extract(epoch from (now() - interval '1 month')) * 1000)::bigint`;

const basicStatsColumns = {
    allUsedUsers: sql<number>`cast(count(*) as int)`,
    allIgnoredUsers: sql<number>`cast(count(*) filter (where ${usersTable.isIgnored} = true) as int)`,
    allMAUUsers: sql<number>`cast(count(*) filter (where ${usersTable.isIgnored} = false and ${usersTable.lastUsedAt} > ${oneMonthAgoMs}) as int)`,
    allInactiveUsers: sql<number>`cast(count(*) filter (where ${usersTable.isIgnored} = false and (${usersTable.lastUsedAt} is null or ${usersTable.lastUsedAt} < ${oneMonthAgoMs})) as int)`,
    allUsedVoices: sql<number>`(
        select cast(coalesce(sum(${voicesTable.usesAmount}), 0) as int)
        from ${voicesTable}
    )`,
};

const mostUsedUsersStats = sql<FullUsersStats[]>`(
    select coalesce(jsonb_agg(to_jsonb(most_used_users)), '[]'::jsonb)
    from (
        select
            ${usersTable.fullname} as "fullname",
            ${usersTable.username} as "username",
            ${usersTable.lastUsedAt} as "lastUsedAt",
            ${usersTable.usesAmount} as "usesAmount"
        from ${usersTable}
        where ${usersTable.isIgnored} = false and ${usersTable.usesAmount} > 0
        order by ${usersTable.usesAmount} desc nulls last
        limit 5
    ) most_used_users
)`;

const lastUsedUsersStats = sql<FullUsersStats[]>`(
    select coalesce(jsonb_agg(to_jsonb(last_used_users)), '[]'::jsonb)
    from (
        select
            ${usersTable.fullname} as "fullname",
            ${usersTable.username} as "username",
            ${usersTable.lastUsedAt} as "lastUsedAt",
            ${usersTable.usesAmount} as "usesAmount"
        from ${usersTable}
        where ${usersTable.isIgnored} = false and ${usersTable.usesAmount} > 0
        order by ${usersTable.lastUsedAt} desc nulls last
        limit 5
    ) last_used_users
)`;

const mostUsedVoicesStats = sql<FullVoicesStats[]>`(
    select coalesce(jsonb_agg(to_jsonb(most_used_voices)), '[]'::jsonb)
    from (
        select
            ${voicesTable.voiceTitle} as "voiceTitle",
            ${voicesTable.usesAmount} as "usesAmount"
        from ${voicesTable}
        where ${voicesTable.usesAmount} > 0
        order by ${voicesTable.usesAmount} desc nulls last
        limit 5
    ) most_used_voices
)`;

export async function getBasicStats() {
    const [stats] = await db.select(basicStatsColumns).from(usersTable);
    if (!stats) throw new Error("Statistics query returned no row");
    return stats;
}

export async function getFullStats() {
    const [stats] = await db
        .select({
            ...basicStatsColumns,
            mostUsedUsersStats,
            lastUsedUsersStats,
            mostUsedVoicesStats,
        })
        .from(usersTable);

    if (!stats) throw new Error("Full statistics query returned no row");
    return stats;
}
