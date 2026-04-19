import { MAX_MENU_ELEMENTS_PER_PAGE } from "../../constants/inline";
import type { MenuContext } from "../../context";
import { genericPrevHandler } from "../generic/generic-prev-handler";

export async function prevPageHandler(ctx: MenuContext) {
    const { currentFavoritesOffset } = ctx.session;

    await genericPrevHandler(ctx, {
        currentOffset: currentFavoritesOffset,
        elementsPerPage: MAX_MENU_ELEMENTS_PER_PAGE,
        offsetUpdate: (newOffset) =>
            (ctx.session.currentFavoritesOffset = newOffset),
    });
}
