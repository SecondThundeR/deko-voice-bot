import { setTimeout as delay } from "node:timers/promises";

import { sql } from "drizzle-orm";

import type { Logger } from "#root/logger.js";

import { db } from "../db.ts";
import {
    type InsertUser,
    processedUsageUpdatesTable,
    type SelectVoice,
    usersTable,
    voicesTable,
} from "../schema.ts";

const RETRY_DELAYS_MS = [0, 100, 300] as const;

type UserDetails = Omit<InsertUser, "isIgnored" | "usesAmount" | "lastUsedAt">;

interface RecordUsageOptions {
    logger?: Logger;
    updateId: number;
    user: UserDetails;
    voiceId: SelectVoice["voiceId"];
}

export async function recordUsage({
    logger,
    updateId,
    user,
    voiceId,
}: RecordUsageOptions) {
    for (const [attempt, retryDelayMs] of RETRY_DELAYS_MS.entries()) {
        if (retryDelayMs > 0) {
            await delay(retryDelayMs);
        }

        try {
            await recordUsageOnce({ updateId, user, voiceId });
            return;
        } catch (error) {
            const isLastAttempt = attempt === RETRY_DELAYS_MS.length - 1;

            logger?.warn({
                msg: isLastAttempt
                    ? "Failed to record usage"
                    : "Failed to record usage; retrying",
                err: error,
                updateId,
                voiceId,
                attempt: attempt + 1,
            });

            if (isLastAttempt) {
                throw error;
            }
        }
    }
}

async function recordUsageOnce({
    updateId,
    user: { userId, fullname, username },
    voiceId,
}: Omit<RecordUsageOptions, "logger">) {
    const usedAt = Date.now();

    await db.execute(sql`
        with new_usage_update as (
            insert into ${processedUsageUpdatesTable}
                (update_id)
            values (${updateId}::bigint)
            on conflict do nothing
            returning update_id
        ),
        voice_usage as (
            update ${voicesTable}
            set uses_amount = ${voicesTable.usesAmount} + 1
            where
                ${voicesTable.voiceId} = ${voiceId}
                and exists (select 1 from new_usage_update)
            returning voice_id
        )
        insert into ${usersTable}
            (
                user_id,
                fullname,
                username,
                uses_amount,
                last_used_at
            )
        select
            ${userId}::bigint,
            ${fullname ?? null},
            ${username ?? null},
            1,
            ${usedAt}::bigint
        where exists (select 1 from new_usage_update)
        on conflict (user_id) do update set
            fullname = excluded.fullname,
            username = excluded.username,
            uses_amount = ${usersTable.usesAmount} + 1,
            last_used_at = excluded.last_used_at
        where ${usersTable.isIgnored} = false
    `);
}
