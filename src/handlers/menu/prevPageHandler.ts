import { maxMenuElementsPerPage } from "@/src/constants/inline.ts";

import type { MenuBotContext } from "@/src/types/bot.ts";

export async function prevPageHandler(ctx: MenuBotContext) {
    const { currentOffset } = ctx.session;

    if (currentOffset === 0) {
        return void await ctx.answerCallbackQuery({
            text: ctx.t("menu.alreadyPrev"),
            show_alert: true,
        });
    }

    const newOffset = currentOffset - maxMenuElementsPerPage;
    ctx.session.currentOffset = newOffset < 0 ? 0 : newOffset;

    ctx.menu.update();
    await ctx.answerCallbackQuery();
}
