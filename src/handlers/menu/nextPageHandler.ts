import { maxMenuElementsPerPage } from "@/src/constants/inline.ts";
import { MenuBotContext } from "@/src/types/bot.ts";
import { locale } from "@/src/constants/locale.ts";

const { failedToGetSessionData, alreadyNext } = locale.frontend.menu;

export async function nextPageHandler(ctx: MenuBotContext) {
    if (!ctx.session.currentFavorites) {
        return await ctx.answerCallbackQuery({
            text: failedToGetSessionData,
            show_alert: true,
        });
    }

    await ctx.answerCallbackQuery();

    const newOffset = ctx.session.currentOffset + maxMenuElementsPerPage;
    if (newOffset >= ctx.session.currentFavorites.length) {
        return ctx.answerCallbackQuery({
            text: alreadyNext,
            show_alert: true,
        });
    }

    ctx.session.currentOffset = newOffset;
    ctx.menu.update();
}
