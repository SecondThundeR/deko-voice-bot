import { MenuBotContext } from "@/src/types/bot.ts";
import { maxMenuElementsPerPage } from "@/src/constants/inline.ts";
import { locale } from "@/src/constants/locale.ts";

const { alreadyPrev } = locale.frontend.menu;

export async function prevPageHandler(ctx: MenuBotContext) {
    const { currentOffset } = ctx.session;
    if (currentOffset === 0) {
        return await ctx.answerCallbackQuery({
            text: alreadyPrev,
            show_alert: true,
        });
    }

    await ctx.answerCallbackQuery();

    const newOffset = currentOffset - maxMenuElementsPerPage;
    ctx.session.currentOffset = newOffset < 0 ? 0 : newOffset;

    ctx.menu.update();
}
