import { locale } from "@/src/constants/locale.ts";

import { isBotBlockedByUser } from "@/src/helpers/api.ts";

import type { BotContext } from "@/src/types/bot.ts";

const { botBlocked, menu: { failedToDelete } } = locale.frontend;

export async function closeMenuHandler(ctx: BotContext) {
    if (await isBotBlockedByUser(ctx)) {
        return void await ctx.answerCallbackQuery(botBlocked);
    }

    ctx.session.currentFavorites = null;
    ctx.session.currentOffset = 0;

    try {
        await ctx.deleteMessage();
    } catch (error: unknown) {
        console.error(
            `Failed to run closeMenuHandler: ${(error as Error).message}`,
        );
        const messageId = ctx.msg?.message_id;
        const replyParams = {
            reply_parameters: messageId
                ? {
                    message_id: messageId,
                }
                : undefined,
        };
        await ctx.reply(failedToDelete, replyParams);
    } finally {
        await ctx.answerCallbackQuery();
    }
}
