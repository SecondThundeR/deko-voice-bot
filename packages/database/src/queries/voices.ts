import { VOICE_ID_PATTERN } from "@deko-voice-bot/contracts";
import { and, desc, eq, isNotNull, sql } from "drizzle-orm";

import { db } from "../db.ts";
import {
    type InsertVoice,
    type SelectUser,
    type SelectVoice,
    usersFavoritesTable,
    voicesTable,
} from "../schema.ts";

const VOICE_TITLE_SIMILARITY_THRESHOLD = 0.2;

export function isValidVoiceId(voiceId: string) {
    return VOICE_ID_PATTERN.test(voiceId);
}

function escapeLikePattern(value: string) {
    return value
        .replaceAll("\\", "\\\\")
        .replaceAll("%", "\\%")
        .replaceAll("_", "\\_");
}

type GetVoicesPageOptions = {
    favoritesUserId?: SelectUser["userId"];
    limit: number;
    offset: number;
    onlyFavorites?: boolean;
    orderFavoritesFirst?: boolean;
    orderUsesFirst?: boolean;
    query?: SelectVoice["voiceTitle"];
};

export async function getVoicesByUniqueId(
    fileUniqueId: SelectVoice["fileUniqueId"],
) {
    return db
        .select()
        .from(voicesTable)
        .where(eq(voicesTable.fileUniqueId, fileUniqueId))
        .orderBy(voicesTable.voiceId);
}

export async function getVoiceById(voiceId: SelectVoice["voiceId"]) {
    const [voice] = await db
        .select()
        .from(voicesTable)
        .where(eq(voicesTable.voiceId, voiceId))
        .limit(1);

    return voice ?? null;
}

export async function getVoicesCount() {
    return db.$count(voicesTable);
}

export async function getVoicesPage({
    favoritesUserId,
    limit,
    offset,
    onlyFavorites = false,
    orderFavoritesFirst = false,
    orderUsesFirst = false,
    query,
}: GetVoicesPageOptions) {
    const escapedQuery = query ? escapeLikePattern(query) : undefined;
    const filters = query
        ? sql`(
            ${voicesTable.voiceTitle} ilike ${`%${escapedQuery}%`} escape '\\'
            or word_similarity(${query}, ${voicesTable.voiceTitle}) > ${VOICE_TITLE_SIMILARITY_THRESHOLD}
        )`
        : undefined;

    const similarityOrder = query
        ? desc(sql`word_similarity(${query}, ${voicesTable.voiceTitle})`)
        : undefined;

    if (onlyFavorites && !favoritesUserId) return [];

    if (!favoritesUserId) {
        return db
            .select({
                voiceId: voicesTable.voiceId,
                voiceTitle: voicesTable.voiceTitle,
                fileId: voicesTable.fileId,
                fileUniqueId: voicesTable.fileUniqueId,
                usesAmount: voicesTable.usesAmount,
                isFavorite: sql<boolean>`false`,
            })
            .from(voicesTable)
            .where(filters)
            .orderBy(
                ...(similarityOrder ? [similarityOrder] : []),
                ...(orderUsesFirst ? [desc(voicesTable.usesAmount)] : []),
                voicesTable.voiceTitle,
            )
            .limit(limit)
            .offset(offset);
    }

    return db
        .select({
            voiceId: voicesTable.voiceId,
            voiceTitle: voicesTable.voiceTitle,
            fileId: voicesTable.fileId,
            fileUniqueId: voicesTable.fileUniqueId,
            usesAmount: voicesTable.usesAmount,
            isFavorite: sql<boolean>`${usersFavoritesTable.voiceId} is not null`,
        })
        .from(voicesTable)
        .leftJoin(
            usersFavoritesTable,
            and(
                eq(usersFavoritesTable.voiceId, voicesTable.voiceId),
                eq(usersFavoritesTable.userId, favoritesUserId),
            ),
        )
        .where(
            and(
                filters,
                onlyFavorites
                    ? isNotNull(usersFavoritesTable.voiceId)
                    : undefined,
            ),
        )
        .orderBy(
            ...(orderFavoritesFirst
                ? [desc(sql`${usersFavoritesTable.voiceId} is not null`)]
                : []),
            ...(similarityOrder ? [similarityOrder] : []),
            ...(orderUsesFirst ? [desc(voicesTable.usesAmount)] : []),
            voicesTable.voiceTitle,
        )
        .limit(limit)
        .offset(offset);
}

export async function isVoiceIdUnique(voiceId: SelectVoice["voiceId"]) {
    const [existingVoice] = await db
        .select({ voiceId: voicesTable.voiceId })
        .from(voicesTable)
        .where(eq(voicesTable.voiceId, voiceId))
        .limit(1);

    return !existingVoice;
}

export async function addVoice(data: Omit<InsertVoice, "usesAmount">) {
    if (!isValidVoiceId(data.voiceId)) return false;
    const [insertedVoice] = await db
        .insert(voicesTable)
        .values(data)
        .onConflictDoNothing()
        .returning({ voiceId: voicesTable.voiceId });

    return !!insertedVoice;
}

export async function updateVoiceId(
    voiceId: InsertVoice["voiceId"],
    newVoiceId: InsertVoice["voiceId"],
) {
    if (!isValidVoiceId(newVoiceId)) return false;
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

export async function deleteVoice(voiceId: SelectVoice["voiceId"]) {
    return await db.transaction(async (tx) => {
        const [deletedVoice] = await tx
            .delete(voicesTable)
            .where(eq(voicesTable.voiceId, voiceId))
            .returning({ voiceTitle: voicesTable.voiceTitle });

        if (!deletedVoice) {
            return null;
        }

        const [remainingVoice] = await tx
            .select({ voiceId: voicesTable.voiceId })
            .from(voicesTable)
            .limit(1);

        return {
            hasVoices: !!remainingVoice,
            voiceTitle: deletedVoice.voiceTitle,
        };
    });
}
