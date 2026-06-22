import { MAX_MENU_ELEMENTS_PER_PAGE } from "#root/bot/constants/inline.js";
import type { MenuContext } from "#root/bot/context.js";
import { genericPrevHandler } from "../generic/generic-prev-handler.ts";

export function prevPageHandler(ctx: MenuContext) {
    const { currentFavoritesOffset } = ctx.session;

    return genericPrevHandler(ctx, {
        currentOffset: currentFavoritesOffset,
        elementsPerPage: MAX_MENU_ELEMENTS_PER_PAGE,
        offsetUpdate: (newOffset) =>
            (ctx.session.currentFavoritesOffset = newOffset),
    });
}
