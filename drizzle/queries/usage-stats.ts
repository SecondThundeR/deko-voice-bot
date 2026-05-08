import { eq, sql } from "drizzle-orm";

import type { Logger } from "@/logger";

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

export function trackVoiceUsage(
    voiceId: SelectVoice["voiceId"],
    logger?: Logger,
) {
    const usesAmount = (voiceUses.get(voiceId) ?? 0) + 1;
    voiceUses.set(voiceId, usesAmount);

    logger?.debug({
        msg: "Voice usage tracked",
        voiceId,
        usesAmount,
        pendingVoiceUses: voiceUses.size,
    });
}

export function trackUserUsage(userDetails: UserDetails, logger?: Logger) {
    if (ignoredUsers.has(userDetails.userId)) {
        logger?.debug({
            msg: "User usage ignored",
            userId: userDetails.userId,
            ignoredUsers: ignoredUsers.size,
        });
        return;
    }

    const existing = userUses.get(userDetails.userId);
    const usesAmount = (existing?.usesAmount ?? 0) + 1;

    userUses.set(userDetails.userId, {
        ...userDetails,
        usesAmount,
    });

    logger?.debug({
        msg: "User usage tracked",
        userId: userDetails.userId,
        usesAmount,
        pendingUserUses: userUses.size,
    });
}

export function allowUserUsage(userId: UserDetails["userId"], logger?: Logger) {
    ignoredUsers.delete(userId);

    logger?.debug({
        msg: "User usage allowed",
        userId,
        ignoredUsers: ignoredUsers.size,
    });
}

export function ignoreUserUsage(
    userId: UserDetails["userId"],
    logger?: Logger,
) {
    ignoredUsers.add(userId);

    const userUsageStats = userUses.get(userId);
    userUses.delete(userId);

    logger?.debug({
        msg: "User usage disabled",
        userId,
        pendingUsesAmount: userUsageStats?.usesAmount ?? 0,
        ignoredUsers: ignoredUsers.size,
        pendingUserUses: userUses.size,
    });

    return userUsageStats;
}

export async function loadIgnoredUsers(logger?: Logger) {
    const ignoredUserIds = await db
        .select({ userId: usersTable.userId })
        .from(usersTable)
        .where(eq(usersTable.isIgnored, true));

    for (const { userId } of ignoredUserIds) {
        ignoredUsers.add(userId);
    }

    logger?.debug({
        msg: "Ignored users loaded",
        ignoredUsers: ignoredUsers.size,
    });
}

export function startUsageStatsFlushInterval(
    onError: (error: unknown) => void,
    logger?: Logger,
) {
    if (flushTimer) {
        logger?.debug({
            msg: "Usage stats flush interval already started",
            flushIntervalMs: FLUSH_INTERVAL_MS,
        });
        return;
    }

    flushTimer = setInterval(() => {
        flushUsageStats(logger).catch(onError);
    }, FLUSH_INTERVAL_MS);

    logger?.debug({
        msg: "Usage stats flush interval started",
        flushIntervalMs: FLUSH_INTERVAL_MS,
    });
}

export async function stopUsageStatsFlushInterval(logger?: Logger) {
    if (flushTimer) {
        clearInterval(flushTimer);
        flushTimer = undefined;

        logger?.debug({
            msg: "Usage stats flush interval stopped",
            pendingVoiceUses: voiceUses.size,
            pendingUserUses: userUses.size,
        });
    }

    while (currentFlush || voiceUses.size > 0 || userUses.size > 0) {
        await flushUsageStats(logger);
    }
}

function flushUsageStats(logger?: Logger) {
    if (currentFlush) {
        logger?.debug({
            msg: "Usage stats flush already in progress",
            pendingVoiceUses: voiceUses.size,
            pendingUserUses: userUses.size,
        });
        return currentFlush;
    }

    if (voiceUses.size === 0 && userUses.size === 0) {
        logger?.debug({
            msg: "Usage stats flush skipped",
            pendingVoiceUses: voiceUses.size,
            pendingUserUses: userUses.size,
        });
        return Promise.resolve();
    }

    currentFlush = flushUsageStatsSnapshot(logger).finally(() => {
        currentFlush = undefined;
    });

    return currentFlush;
}

async function flushUsageStatsSnapshot(logger?: Logger) {
    const voiceUsesSnapshot = new Map(voiceUses);
    const userUsesSnapshot = new Map(userUses);
    const flushedAt = Date.now();
    voiceUses.clear();
    userUses.clear();

    logger?.debug({
        msg: "Usage stats flush started",
        voiceUsageRows: voiceUsesSnapshot.size,
        userUsageRows: userUsesSnapshot.size,
        flushedAt,
    });

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

                logger?.debug({
                    msg: "Voice usage flushed",
                    voiceUsageRows: voiceUsesSnapshot.size,
                });
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

                logger?.debug({
                    msg: "User usage flushed",
                    userUsageRows: userUsesSnapshot.size,
                });
            }
        });

        logger?.debug({
            msg: "Usage stats flush completed",
            voiceUsageRows: voiceUsesSnapshot.size,
            userUsageRows: userUsesSnapshot.size,
        });
    } catch (error) {
        mergeVoiceUses(voiceUsesSnapshot);
        mergeUserUses(userUsesSnapshot);

        logger?.debug({
            msg: "Usage stats flush failed and pending stats were restored",
            voiceUsageRows: voiceUsesSnapshot.size,
            userUsageRows: userUsesSnapshot.size,
            pendingVoiceUses: voiceUses.size,
            pendingUserUses: userUses.size,
        });

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
