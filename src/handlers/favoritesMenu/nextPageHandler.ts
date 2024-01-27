import { maxMenuElementsPerPage } from "@/src/constants/inline.ts";

import type { MenuBotContext } from "@/src/types/bot.ts";
import { genericNextHandler } from "@/src/handlers/menu/genericNextHandler.ts";

export async function nextPageHandler(ctx: MenuBotContext) {
    const { currentFavorites, currentFavoritesOffset } = ctx.session;
    await genericNextHandler(ctx, {
        menuElements: currentFavorites,
        currentOffset: currentFavoritesOffset,
        elementsPerPage: maxMenuElementsPerPage,
        offsetUpdate: (newOffset) =>
            ctx.session.currentFavoritesOffset = newOffset,
    });
}
