import { getVoicesCount } from "#drizzle/queries/select.js";
import { MAX_MENU_ELEMENTS_PER_PAGE } from "#root/bot/constants/inline.js";
import type { MenuContext } from "#root/bot/context.js";
import { genericNextHandler } from "../generic/generic-next-handler.ts";

export async function nextPageHandler(ctx: MenuContext) {
    const { currentFavoritesOffset } = ctx.session;
    const totalElements = await getVoicesCount();

    return genericNextHandler(ctx, {
        currentOffset: currentFavoritesOffset,
        elementsPerPage: MAX_MENU_ELEMENTS_PER_PAGE,
        offsetUpdate: (newOffset) =>
            (ctx.session.currentFavoritesOffset = newOffset),
        totalElements,
    });
}
