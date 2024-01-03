import { maxMenuElementsPerPage } from "@/src/constants/inline.ts";

import { isBotBlockedByUser } from "@/src/helpers/api.ts";

import type { MenuBotContext } from "@/src/types/bot.ts";

export async function nextPageHandler(ctx: MenuBotContext) {
    if (await isBotBlockedByUser(ctx)) {
        return void await ctx.answerCallbackQuery(ctx.t("inline.blocked"));
    }

    if (!ctx.session.currentFavorites) {
        return void await ctx.answerCallbackQuery({
            text: ctx.t("menu.failedToGetSessionData"),
            show_alert: true,
        });
    }

    const newOffset = ctx.session.currentOffset + maxMenuElementsPerPage;

    if (newOffset >= ctx.session.currentFavorites.length) {
        return void ctx.answerCallbackQuery({
            text: ctx.t("menu.alreadyNext"),
            show_alert: true,
        });
    }

    ctx.session.currentOffset = newOffset;

    ctx.menu.update();
    await ctx.answerCallbackQuery();
}
