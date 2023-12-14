import { maxMenuElementsPerPage } from "@/src/constants/inline.ts";
import { MenuBotContext } from "@/src/types/bot.ts";
import { locale } from "@/src/constants/locale.ts";
import { isBotBlockedByUser } from "@/src/helpers/api.ts";

const { botBlocked, menu: { failedToGetSessionData, alreadyNext } } =
    locale.frontend;

export async function nextPageHandler(ctx: MenuBotContext) {
    if (await isBotBlockedByUser(ctx)) {
        return void await ctx.answerCallbackQuery(botBlocked);
    }

    if (!ctx.session.currentFavorites) {
        return void await ctx.answerCallbackQuery({
            text: failedToGetSessionData,
            show_alert: true,
        });
    }

    const newOffset = ctx.session.currentOffset + maxMenuElementsPerPage;
    if (newOffset >= ctx.session.currentFavorites.length) {
        return void ctx.answerCallbackQuery({
            text: alreadyNext,
            show_alert: true,
        });
    }
    ctx.session.currentOffset = newOffset;

    ctx.menu.update();
    await ctx.answerCallbackQuery();
}
