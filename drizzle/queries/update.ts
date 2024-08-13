import { and, eq, getTableColumns } from "drizzle-orm";

import { db } from "../db";
import {
    type SelectFeatureFlag,
    usersTable,
    type SelectUser,
    type SelectVoice,
    voicesTable,
} from "../schema";
import { toggleFeatureFlagQuery } from "../prepared/featureFlags";

// Feature Flags
export async function toggleFeatureFlag(name: SelectFeatureFlag["name"]) {
    const [updatedFeatureFlag] = await toggleFeatureFlagQuery.execute({ name });

    if (!updatedFeatureFlag) return null;

    return updatedFeatureFlag.status;
}

// Voices
export async function updateVoiceId(
    voiceId: SelectVoice["voiceId"],
    newVoiceId: SelectVoice["voiceId"],
) {
    const [updatedVoice] = await db
        .update(voicesTable)
        .set({ voiceId: newVoiceId })
        .where(eq(voicesTable.voiceId, voiceId))
        .returning({ voiceId: voicesTable.voiceId });

    return !!updatedVoice;
}

export async function updateVoiceTitle(
    voiceId: SelectVoice["voiceId"],
    newVoiceTitle: SelectVoice["voiceTitle"],
) {
    const [updatedVoice] = await db
        .update(voicesTable)
        .set({ voiceTitle: newVoiceTitle })
        .where(eq(voicesTable.voiceId, voiceId))
        .returning({ voiceId: voicesTable.voiceId });

    return !!updatedVoice;
}

export async function updateVoiceFile(
    voiceId: SelectVoice["voiceId"],
    { fileId, fileUniqueId }: Pick<SelectVoice, "fileId" | "fileUniqueId">,
) {
    const [updatedVoice] = await db
        .update(voicesTable)
        .set({ fileId, fileUniqueId })
        .where(eq(voicesTable.voiceId, voiceId))
        .returning({ voiceId: voicesTable.voiceId });

    return !!updatedVoice;
}

export async function updateVoiceURL(
    voiceId: SelectVoice["voiceId"],
    { url, fileUniqueId }: Pick<SelectVoice, "url" | "fileUniqueId">,
) {
    const [updatedVoice] = await db
        .update(voicesTable)
        .set({ url, fileUniqueId })
        .where(eq(voicesTable.voiceId, voiceId))
        .returning({ voiceId: voicesTable.voiceId });

    return !!updatedVoice;
}

// Users
export async function markUserAsIgnored(userId: SelectUser["userId"]) {
    const { isIgnored, ...returningCols } = getTableColumns(usersTable);
    const [ignoredUser] = await db
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
        )
        .returning(returningCols);

    if (!ignoredUser) return null;

    return ignoredUser;
}

export async function markUserAsNotIgnored({
    userId,
    fullname,
    username,
}: Omit<SelectUser, "id" | "isIgnored" | "usesAmount" | "lastUsedAt">) {
    const [userRestoreStatus] = await db
        .update(usersTable)
        .set({
            fullname,
            username,
            usesAmount: 0,
            isIgnored: false,
        })
        .where(
            and(eq(usersTable.userId, userId), eq(usersTable.isIgnored, true)),
        )
        .returning({ isIgnored: usersTable.isIgnored });

    if (!userRestoreStatus) return null;

    return true;
}
