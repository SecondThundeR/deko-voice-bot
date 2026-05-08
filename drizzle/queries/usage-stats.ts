import { eq, sql } from "drizzle-orm";

import { db } from "../db";
import {
    type InsertUser,
    type SelectVoice,
    usersTable,
    voicesTable,
} from "../schema";

const FLUSH_INTERVAL_MS = 60 * 1000;

type UserDetails = Omit<InsertUser, "isIgnored" | "usesAmount" | "lastUsedAt">;

interface UserUsageStats extends UserDetails {
    usesAmount: number;
}

const voiceUses = new Map<SelectVoice["voiceId"], number>();
const userUses = new Map<UserDetails["userId"], UserUsageStats>();
const ignoredUsers = new Set<UserDetails["userId"]>();

let flushTimer: ReturnType<typeof setInterval> | undefined;
let currentFlush: Promise<void> | undefined;

export function trackVoiceUsage(voiceId: SelectVoice["voiceId"]) {
    voiceUses.set(voiceId, (voiceUses.get(voiceId) ?? 0) + 1);
}

export function trackUserUsage(userDetails: UserDetails) {
    if (ignoredUsers.has(userDetails.userId)) {
        return;
    }

    const existing = userUses.get(userDetails.userId);

    userUses.set(userDetails.userId, {
        ...userDetails,
        usesAmount: (existing?.usesAmount ?? 0) + 1,
    });
}

export function allowUserUsage(userId: UserDetails["userId"]) {
    ignoredUsers.delete(userId);
}

export function ignoreUserUsage(userId: UserDetails["userId"]) {
    ignoredUsers.add(userId);

    const userUsageStats = userUses.get(userId);
    userUses.delete(userId);

    return userUsageStats;
}

export async function loadIgnoredUsers() {
    const ignoredUserIds = await db
        .select({ userId: usersTable.userId })
        .from(usersTable)
        .where(eq(usersTable.isIgnored, true));

    for (const { userId } of ignoredUserIds) {
        ignoredUsers.add(userId);
    }
}

export function startUsageStatsFlushInterval(
    onError: (error: unknown) => void,
) {
    if (flushTimer) {
        return;
    }

    flushTimer = setInterval(() => {
        flushUsageStats().catch(onError);
    }, FLUSH_INTERVAL_MS);
}

export async function stopUsageStatsFlushInterval() {
    if (flushTimer) {
        clearInterval(flushTimer);
        flushTimer = undefined;
    }

    while (currentFlush || voiceUses.size > 0 || userUses.size > 0) {
        await flushUsageStats();
    }
}

function flushUsageStats() {
    if (currentFlush) {
        return currentFlush;
    }

    if (voiceUses.size === 0 && userUses.size === 0) {
        return Promise.resolve();
    }

    currentFlush = flushUsageStatsSnapshot().finally(() => {
        currentFlush = undefined;
    });

    return currentFlush;
}

async function flushUsageStatsSnapshot() {
    const voiceUsesSnapshot = new Map(voiceUses);
    const userUsesSnapshot = new Map(userUses);
    const flushedAt = Date.now();
    voiceUses.clear();
    userUses.clear();

    try {
        await db.transaction(async (tx) => {
            if (voiceUsesSnapshot.size > 0) {
                const voiceUsageRows = [...voiceUsesSnapshot].map(
                    ([voiceId, usesAmount]) =>
                        sql`(${voiceId}, ${usesAmount}::integer)`,
                );

                await tx.execute(sql`
                    update ${voicesTable}
                    set uses_amount = ${voicesTable.usesAmount} + voice_usage.uses_amount
                    from (values ${sql.join(voiceUsageRows, sql`, `)})
                        as voice_usage(voice_id, uses_amount)
                    where ${voicesTable.voiceId} = voice_usage.voice_id
                `);
            }

            if (userUsesSnapshot.size > 0) {
                const userUsageRows = [...userUsesSnapshot.values()].map(
                    ({ userId, fullname, username, usesAmount }) =>
                        sql`(${userId}::bigint, ${fullname ?? null}, ${username ?? null}, ${usesAmount}::integer, ${flushedAt}::bigint)`,
                );

                await tx.execute(sql`
                    insert into ${usersTable}
                        (user_id, fullname, username, uses_amount, last_used_at)
                    values ${sql.join(userUsageRows, sql`, `)}
                    on conflict (user_id) do update set
                        fullname = excluded.fullname,
                        username = excluded.username,
                        uses_amount = ${usersTable.usesAmount} + excluded.uses_amount,
                        last_used_at = excluded.last_used_at
                    where ${usersTable.isIgnored} = false
                `);
            }
        });
    } catch (error) {
        mergeVoiceUses(voiceUsesSnapshot);
        mergeUserUses(userUsesSnapshot);
        throw error;
    }
}

function mergeVoiceUses(usageStats: Map<SelectVoice["voiceId"], number>) {
    for (const [voiceId, usesAmount] of usageStats) {
        voiceUses.set(voiceId, (voiceUses.get(voiceId) ?? 0) + usesAmount);
    }
}

function mergeUserUses(usageStats: Map<UserDetails["userId"], UserUsageStats>) {
    for (const userUsageStats of usageStats.values()) {
        const existing = userUses.get(userUsageStats.userId);

        userUses.set(userUsageStats.userId, {
            ...userUsageStats,
            ...existing,
            usesAmount: userUsageStats.usesAmount + (existing?.usesAmount ?? 0),
        });
    }
}
