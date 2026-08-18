import { sql } from "drizzle-orm";

import { db } from "../db.ts";
import { retryDatabaseOperation } from "../retry.ts";
import {
    type InsertUser,
    processedUsageUpdatesTable,
    type SelectVoice,
    usersTable,
    voicesTable,
} from "../schema.ts";

type UserDetails = Omit<InsertUser, "isIgnored" | "usesAmount" | "lastUsedAt">;

interface RecordUsageOptions {
    logger?: {
        warn(data: Record<string, unknown>): void;
    };
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
    await retryDatabaseOperation(
        () => recordUsageOnce({ updateId, user, voiceId }),
        (error, attempt, isLastAttempt) => {
            logger?.warn({
                msg: isLastAttempt
                    ? "Failed to record usage"
                    : "Failed to record usage; retrying",
                errorType:
                    error instanceof Error ? error.constructor.name : "Unknown",
                errorMessage:
                    error instanceof Error ? error.message : "Unknown error",
                attempt: attempt + 1,
                updateId,
                voiceId,
            });
        },
    );
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
            select ${updateId}::bigint
            where exists (
                select 1 from ${voicesTable} where ${voicesTable.voiceId} = ${voiceId}
            )
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
        where exists (select 1 from voice_usage)
        on conflict (user_id) do update set
            fullname = excluded.fullname,
            username = excluded.username,
            uses_amount = ${usersTable.usesAmount} + 1,
            last_used_at = excluded.last_used_at
        where ${usersTable.isIgnored} = false
    `);
}
