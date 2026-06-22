import { eq, sql } from "drizzle-orm";

import { db } from "../db.ts";
import { type SelectVoice, voicesTable } from "../schema.ts";

export const getVoiceByUniqueIdQuery = db
    .select()
    .from(voicesTable)
    .where(eq(voicesTable.fileUniqueId, sql.placeholder("fileUniqueId")))
    .prepare("get_voice_by_unique_id");

export const deleteVoiceByIdQuery = db
    .delete(voicesTable)
    .where(eq(voicesTable.voiceId, sql.placeholder("voiceId")))
    .returning({ voiceTitle: voicesTable.voiceTitle })
    .prepare("delete_voice_by_id");

export async function deleteVoiceAndCheckHasVoices(
    voiceId: SelectVoice["voiceId"],
) {
    return await db.transaction(async (tx) => {
        await tx.delete(voicesTable).where(eq(voicesTable.voiceId, voiceId));

        const [remaining] = await tx
            .select({
                hasVoices: sql<boolean>`exists(select 1 from ${voicesTable})`,
            })
            .from(voicesTable)
            .limit(1);

        return remaining?.hasVoices ?? false;
    });
}
