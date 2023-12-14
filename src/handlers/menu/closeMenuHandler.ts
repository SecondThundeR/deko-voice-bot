import { BotContext } from "@/src/types/bot.ts";
import { locale } from "@/src/constants/locale.ts";
import { isBotBlockedByUser } from "@/src/helpers/api.ts";

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
        await ctx.reply(failedToDelete, {
            reply_to_message_id: ctx.message?.message_id,
        });
    } finally {
        await ctx.answerCallbackQuery();
    }
}
