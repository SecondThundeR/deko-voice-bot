import { sql } from "drizzle-orm";

import { db } from "../db.ts";
import {
    type InsertUser,
    type SelectVoice,
    usersTable,
    voicesTable,
} from "../schema.ts";

type UserDetails = Omit<InsertUser, "isIgnored" | "usesAmount" | "lastUsedAt">;

interface RecordUsageOptions {
    user: UserDetails;
    voiceId: SelectVoice["voiceId"];
}

export async function recordUsage({ user, voiceId }: RecordUsageOptions) {
    const { userId, fullname, username } = user;
    const usedAt = Date.now();

    await db.execute(sql`
        with voice_usage as (
            update ${voicesTable}
            set uses_amount = ${voicesTable.usesAmount} + 1
            where ${voicesTable.voiceId} = ${voiceId}
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
