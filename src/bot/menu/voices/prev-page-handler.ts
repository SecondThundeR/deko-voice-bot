import { MAX_MENU_ELEMENTS_PER_PAGE } from "../../constants/inline";
import type { MenuContext } from "../../context";
import { genericPrevHandler } from "../generic/generic-prev-handler";

export function prevPageHandler(ctx: MenuContext) {
    const { currentVoicesOffset } = ctx.session;

    return genericPrevHandler(ctx, {
        currentOffset: currentVoicesOffset,
        elementsPerPage: MAX_MENU_ELEMENTS_PER_PAGE,
        offsetUpdate: (newOffset) =>
            (ctx.session.currentVoicesOffset = newOffset),
    });
}
