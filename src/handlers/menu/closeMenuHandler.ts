import { getReplyParameters } from "@/src/helpers/api.ts";

import type { BotContext } from "@/src/types/bot.ts";

export async function closeMenuHandler(ctx: BotContext) {
    ctx.session.currentFavorites = null;
    ctx.session.currentOffset = 0;

    try {
        await ctx.deleteMessage();
    } catch (error: unknown) {
        console.error(
            `Failed to run closeMenuHandler: ${(error as Error).message}`,
        );
        const messageId = ctx.msg?.message_id;
        await ctx.reply(
            ctx.t("menu.failedToDelete"),
            getReplyParameters(messageId),
        );
    } finally {
        await ctx.answerCallbackQuery();
    }
}
