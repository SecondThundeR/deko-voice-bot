import { eq, sql } from "drizzle-orm";

import { db } from "../db";
import { type SelectVoice, voicesTable } from "../schema";

export const getVoiceByUniqueIdQuery = db
    .select()
    .from(voicesTable)
    .where(eq(voicesTable.fileUniqueId, sql.placeholder("fileUniqueId")))
    .prepare("get_voice_by_unique_id");

export const incrementVoiceUsesAmountQuery = db
    .update(voicesTable)
    .set({
        usesAmount: sql`${voicesTable.usesAmount} + 1`,
    })
    .where(eq(voicesTable.voiceId, sql.placeholder("voiceId")))
    .prepare("increment_voice_use_amount");

export const deleteVoiceByIdQuery = db
    .delete(voicesTable)
    .where(eq(voicesTable.voiceId, sql.placeholder("voiceId")))
    .returning({ voiceTitle: voicesTable.voiceTitle })
    .prepare("delete_voice_by_id");

export async function deleteVoiceAndCheckHasVoices(
    voiceId: SelectVoice["voiceId"],
) {
    const [data] = await db.execute<{ hasVoices: boolean }>(sql`
        with deleted_voice as (
            delete from ${voicesTable}
            where ${voicesTable.voiceId} = ${voiceId}
            returning 1
        )
        select (
            (select count(*) from ${voicesTable}) >
            (select count(*) from deleted_voice)
        ) as "hasVoices"
    `);

    return data.hasVoices;
}
