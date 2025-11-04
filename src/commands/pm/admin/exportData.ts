import { unlink } from "node:fs/promises";
import { Composer, InputFile } from "grammy";

import { getAllFeatureFlagsQuery } from "@/drizzle/prepared/featureFlags";
import { getAllPaymentsQuery } from "@/drizzle/prepared/payments";
import { getAllUsersQuery } from "@/drizzle/prepared/users";
import { getAllUserFavoritesQuery } from "@/drizzle/prepared/usersFavorites";
import { getAllVoicesQuery } from "@/drizzle/prepared/voices";

import type { BotContext } from "@/src/types/bot";

export const exportDataCommand = new Composer<BotContext>();

exportDataCommand.command("export", async (ctx) => {
    if (ctx.session.isDatabaseMaintenanceActive) {
        return ctx.reply(ctx.t("exportData.maintenancePending"));
    }
    ctx.session.isDatabaseMaintenanceActive = true;
    await ctx.replyWithChatAction("upload_document");

    const fileName = `db-export-${Date.now()}.json`;
    const [featureFlags, voices, users, usersFavorites, payments] =
        await Promise.all([
            getAllFeatureFlagsQuery.execute(),
            getAllVoicesQuery.execute(),
            getAllUsersQuery.execute(),
            getAllUserFavoritesQuery.execute(),
            getAllPaymentsQuery.execute(),
        ]);

    await Bun.write(
        fileName,
        JSON.stringify(
            {
                featureFlags,
                voices,
                users,
                usersFavorites,
                payments,
            },
            null,
            4,
        ),
    );
    await ctx.replyWithDocument(new InputFile(fileName));
    await unlink(fileName);
    ctx.session.isDatabaseMaintenanceActive = false;
});
