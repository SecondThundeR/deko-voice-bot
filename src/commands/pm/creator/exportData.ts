import { unlink } from "node:fs/promises";
import { Composer, InputFile } from "grammy";

import { getAllFeatureFlagsQuery } from "@/drizzle/prepared/featureFlags";
import { getAllUsersQuery } from "@/drizzle/prepared/users";
import { getAllUserFavoritesQuery } from "@/drizzle/prepared/usersFavorites";
import { getAllVoicesQuery } from "@/drizzle/prepared/voices";

import type { BotContext } from "@/src/types/bot";

export const exportDataCommand = new Composer<BotContext>();

exportDataCommand.command("export", async (ctx) => {
    const fileName = `db-export-${Date.now()}.json`;

    await ctx.replyWithChatAction("upload_document");
    const [featureFlags, voices, users, usersFavorites] = await Promise.all([
        getAllFeatureFlagsQuery.execute(),
        getAllVoicesQuery.execute(),
        getAllUsersQuery.execute(),
        getAllUserFavoritesQuery.execute(),
    ]);
    await Bun.write(
        fileName,
        JSON.stringify(
            {
                featureFlags,
                voices,
                users,
                usersFavorites,
            },
            null,
            4,
        ),
    );
    await ctx.replyWithDocument(new InputFile(fileName));
    await unlink(fileName);
});
