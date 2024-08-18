import { and, eq } from "drizzle-orm";

import { toggleFeatureFlagQuery } from "../prepared/featureFlags";

import { db } from "../db";
import {
    usersTable,
    voicesTable,
    type InsertVoice,
    type InsertFeatureFlag,
    type InsertUser,
} from "../schema";

export async function toggleFeatureFlag(name: InsertFeatureFlag["name"]) {
    const [updatedFeatureFlag] = await toggleFeatureFlagQuery.execute({ name });

    if (!updatedFeatureFlag) return null;

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

export async function updateVoiceURL(
    voiceId: InsertVoice["voiceId"],
    { url, fileUniqueId }: Pick<InsertVoice, "url" | "fileUniqueId">,
) {
    const [updatedVoice] = await db
        .update(voicesTable)
        .set({ url, fileUniqueId })
        .where(eq(voicesTable.voiceId, voiceId))
        .returning({ voiceId: voicesTable.voiceId });

    return !!updatedVoice;
}

export async function markUserAsIgnored(userId: InsertUser["userId"]) {
    await db
        .update(usersTable)
        .set({
            fullname: null,
            username: null,
            usesAmount: null,
            lastUsedAt: null,
            isIgnored: true,
        })
        .where(
            and(eq(usersTable.userId, userId), eq(usersTable.isIgnored, false)),
        );
}

export async function markUserAsNotIgnored({
    userId,
    fullname,
    username,
}: Omit<InsertUser, "id" | "isIgnored" | "usesAmount" | "lastUsedAt">) {
    const [userRestoreStatus] = await db
        .update(usersTable)
        .set({
            fullname,
            username,
            usesAmount: 0,
            lastUsedAt: null,
            isIgnored: false,
        })
        .where(
            and(eq(usersTable.userId, userId), eq(usersTable.isIgnored, true)),
        )
        .returning({ isIgnored: usersTable.isIgnored });

    if (!userRestoreStatus) return null;

    return true;
}
