import { MenuBotContext } from "@/src/types/bot.ts";
import { locale } from "@/src/constants/locale.ts";
import { isBotBlockedByUser } from "@/src/helpers/api.ts";

const { botBlocked, menu: { outdated, failedToUpdate } } = locale.frontend;

export async function outdatedHandler(ctx: MenuBotContext) {
    if (await isBotBlockedByUser(ctx)) {
        return void await ctx.answerCallbackQuery(botBlocked);
    }

    let isFailedToUpdate = false;

    try {
        if (!ctx.session.currentFavorites) {
            await ctx.deleteMessage();
        } else {
            ctx.menu.update();
        }
    } catch (error: unknown) {
        isFailedToUpdate = true;
        console.error(
            `Failed to run outdatedHandler: ${(error as Error).message}`,
        );
        await ctx.reply(failedToUpdate, {
            reply_to_message_id: ctx.message?.message_id,
        });
    } finally {
        await ctx.answerCallbackQuery(
            ctx.session.currentFavorites && !isFailedToUpdate
                ? outdated
                : undefined,
        );
    }
}
