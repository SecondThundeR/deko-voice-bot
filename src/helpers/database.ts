import type { infer as Infer } from "zod";

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
                await tx.insert(usersTable).values(users);
            }
            if (voices.length > 0) {
                await tx.insert(voicesTable).values(voices);
            }
            if (usersFavorites.length > 0) {
                await tx.insert(usersFavoritesTable).values(usersFavorites);
            }
            if (featureFlags.length > 0) {
                await tx.insert(featureFlagsTable).values(featureFlags);
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
