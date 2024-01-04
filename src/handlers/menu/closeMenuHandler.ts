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
        if (!messageId) {
            return void await ctx.reply(ctx.t("menu.failedToDelete"));
        }

        await ctx.reply(ctx.t("menu.failedToDelete"), {
            reply_parameters: {
                message_id: messageId,
            },
        });
    } finally {
        await ctx.answerCallbackQuery();
    }
}
