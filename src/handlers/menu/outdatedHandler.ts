import { MenuBotContext } from "@/src/types/bot.ts";
import { locale } from "@/src/constants/locale.ts";

const { outdated, failedToUpdate } = locale.frontend.menu;

export async function outdatedHandler(ctx: MenuBotContext) {
    try {
        if (!ctx.session.currentFavorites) {
            await ctx.deleteMessage();
            await ctx.answerCallbackQuery();
        } else {
            ctx.menu.update();
            await ctx.answerCallbackQuery(outdated);
        }
    } catch (error: unknown) {
        console.error(
            `Failed to run outdatedHandler: ${(error as Error).message}`,
        );
        await ctx.reply(failedToUpdate, {
            reply_to_message_id: ctx.message?.message_id,
        });
        await ctx.answerCallbackQuery();
    }
}
