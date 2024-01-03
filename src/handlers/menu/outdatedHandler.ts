import { locale } from "@/src/constants/locale.ts";

import { isBotBlockedByUser } from "@/src/helpers/api.ts";

import type { MenuBotContext } from "@/src/types/bot.ts";

const { botBlocked, menu: { outdated, failedToUpdate } } = locale.frontend;

export async function outdatedHandler(ctx: MenuBotContext) {
    if (await isBotBlockedByUser(ctx)) {
        return void await ctx.answerCallbackQuery(botBlocked);
    }

    try {
        if (!ctx.session.currentFavorites) {
            await ctx.deleteMessage();
        } else {
            ctx.menu.update();
        }

        const answerText = ctx.session.currentFavorites ? outdated : undefined;
        await ctx.answerCallbackQuery(answerText);
    } catch (error: unknown) {
        console.error(
            `Failed to run outdatedHandler: ${(error as Error).message}`,
        );
        const messageId = ctx.msg?.message_id;
        const replyParams = {
            reply_parameters: messageId
                ? {
                    message_id: messageId,
                }
                : undefined,
        };
        await ctx.reply(failedToUpdate, replyParams);
        await ctx.answerCallbackQuery();
    }
}
