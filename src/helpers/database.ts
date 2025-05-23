import type { infer as Infer } from "zod/v4";
import chunk from "lodash.chunk";

import { db } from "@/drizzle/db";
import {
    featureFlagsTable,
    usersFavoritesTable,
    usersTable,
    voicesTable,
} from "@/drizzle/schema";

import type { importFileSchema } from "@/src/schema/importFile";

import type { BotContext } from "@/src/types/bot";

import type { getMessageEditCallback } from "./api";

const CHUNK_SIZE = 300;

export async function importDatabaseWithTransaction(
    ctx: BotContext,
    editMessage: ReturnType<typeof getMessageEditCallback>,
    {
        users,
        voices,
        usersFavorites,
        featureFlags,
    }: Infer<typeof importFileSchema>,
) {
    await db.transaction(async (tx) => {
        try {
            await tx.delete(usersFavoritesTable);
            await tx.delete(usersTable);
            await tx.delete(voicesTable);
            await tx.delete(featureFlagsTable);

            if (users.length > 0) {
                for (const usersChunk of chunk(users, CHUNK_SIZE)) {
                    await tx.insert(usersTable).values(usersChunk);
                }
            }
            if (voices.length > 0) {
                for (const voicesChunk of chunk(voices, CHUNK_SIZE)) {
                    await tx.insert(voicesTable).values(voicesChunk);
                }
            }
            if (usersFavorites.length > 0) {
                for (const usersFavoritesChunk of chunk(
                    usersFavorites,
                    CHUNK_SIZE,
                )) {
                    await tx
                        .insert(usersFavoritesTable)
                        .values(usersFavoritesChunk);
                }
            }
            if (featureFlags.length > 0) {
                for (const featureFlagsChunk of chunk(
                    featureFlags,
                    CHUNK_SIZE,
                )) {
                    await tx
                        .insert(featureFlagsTable)
                        .values(featureFlagsChunk);
                }
            }

            await editMessage(ctx.t("importData.done"));
        } catch (error: unknown) {
            if (error instanceof Error) {
                await editMessage(
                    ctx.t("importData.error", {
                        errorMessage: error.message,
                    }),
                    {
                        parse_mode: "HTML",
                    },
                );
            } else {
                await editMessage(ctx.t("importData.unknownError"));
            }

            tx.rollback();
        }
    });
}
