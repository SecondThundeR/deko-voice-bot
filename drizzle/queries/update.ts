import { eq } from "drizzle-orm";
import { db } from "../db";
import { toggleFeatureFlagQuery } from "../prepared/feature-flags";
import {
    type InsertFeatureFlag,
    type InsertVoice,
    voicesTable,
} from "../schema";

export async function toggleFeatureFlag(name: InsertFeatureFlag["name"]) {
    const [updatedFeatureFlag] = await toggleFeatureFlagQuery.execute({ name });

    return updatedFeatureFlag.status;
}

export async function updateVoiceId(
    voiceId: InsertVoice["voiceId"],
    newVoiceId: InsertVoice["voiceId"],
) {
    const [updatedVoice] = await db
        .update(voicesTable)
        .set({ voiceId: newVoiceId })
        .where(eq(voicesTable.voiceId, voiceId))
        .returning({ voiceId: voicesTable.voiceId });

    return !!updatedVoice;
}

export async function updateVoiceTitle(
    voiceId: InsertVoice["voiceId"],
    newVoiceTitle: InsertVoice["voiceTitle"],
) {
    const [updatedVoice] = await db
        .update(voicesTable)
        .set({ voiceTitle: newVoiceTitle })
        .where(eq(voicesTable.voiceId, voiceId))
        .returning({ voiceId: voicesTable.voiceId });

    return !!updatedVoice;
}

export async function updateVoiceFile(
    voiceId: InsertVoice["voiceId"],
    { fileId, fileUniqueId }: Pick<InsertVoice, "fileId" | "fileUniqueId">,
) {
    const [updatedVoice] = await db
        .update(voicesTable)
        .set({ fileId, fileUniqueId })
        .where(eq(voicesTable.voiceId, voiceId))
        .returning({ voiceId: voicesTable.voiceId });

    return !!updatedVoice;
}
