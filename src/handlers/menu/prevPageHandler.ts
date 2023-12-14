import { MenuBotContext } from "@/src/types/bot.ts";
import { maxMenuElementsPerPage } from "@/src/constants/inline.ts";
import { locale } from "@/src/constants/locale.ts";
import { isBotBlockedByUser } from "@/src/helpers/api.ts";

const { botBlocked, menu: { alreadyPrev } } = locale.frontend;

export async function prevPageHandler(ctx: MenuBotContext) {
    if (await isBotBlockedByUser(ctx)) {
        return void await ctx.answerCallbackQuery(botBlocked);
    }

    const { currentOffset } = ctx.session;
    if (currentOffset === 0) {
        return void await ctx.answerCallbackQuery({
            text: alreadyPrev,
            show_alert: true,
        });
    }

    const newOffset = currentOffset - maxMenuElementsPerPage;
    ctx.session.currentOffset = newOffset < 0 ? 0 : newOffset;

    ctx.menu.update();
    await ctx.answerCallbackQuery();
}
