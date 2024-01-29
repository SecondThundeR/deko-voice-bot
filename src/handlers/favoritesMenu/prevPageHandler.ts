import { maxMenuElementsPerPage } from "@/src/constants/inline.ts";

import { genericPrevHandler } from "@/src/handlers/menu/genericPrevHandler.ts";

import type { MenuBotContext } from "@/src/types/bot.ts";

export async function prevPageHandler(ctx: MenuBotContext) {
    const { currentFavoritesOffset } = ctx.session;

    await genericPrevHandler(ctx, {
        currentOffset: currentFavoritesOffset,
        elementsPerPage: maxMenuElementsPerPage,
        offsetUpdate: (newOffset) =>
            ctx.session.currentFavoritesOffset = newOffset,
    });
}
