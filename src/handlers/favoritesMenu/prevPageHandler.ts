import { MAX_MENU_ELEMENTS_PER_PAGE } from "@/src/constants/inline";

import { genericPrevHandler } from "@/src/handlers/menu/genericPrevHandler";

import type { MenuBotContext } from "@/src/types/bot";

export async function prevPageHandler(ctx: MenuBotContext) {
    const { currentFavoritesOffset } = ctx.session;

    await genericPrevHandler(ctx, {
        currentOffset: currentFavoritesOffset,
        elementsPerPage: MAX_MENU_ELEMENTS_PER_PAGE,
        offsetUpdate: (newOffset) =>
            (ctx.session.currentFavoritesOffset = newOffset),
    });
}
