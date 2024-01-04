import { getReplyParameters } from "@/src/helpers/api.ts";

import type { MenuBotContext } from "@/src/types/bot.ts";

export async function outdatedHandler(ctx: MenuBotContext) {
    try {
        if (!ctx.session.currentFavorites) {
            await ctx.deleteMessage();
        } else {
            ctx.menu.update();
        }

        const answerText = ctx.session.currentFavorites
            ? ctx.t("menu.outdated")
            : undefined;
        await ctx.answerCallbackQuery(answerText);
    } catch (error: unknown) {
        console.error(
            `Failed to run outdatedHandler: ${(error as Error).message}`,
        );
        const messageId = ctx.msg?.message_id;
        await ctx.reply(
            ctx.t("menu.failedToUpdate"),
            getReplyParameters(messageId),
        );
        await ctx.answerCallbackQuery();
    }
}
