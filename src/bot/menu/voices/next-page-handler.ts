import { MAX_MENU_ELEMENTS_PER_PAGE } from "../../constants/inline";
import type { MenuContext } from "../../context";
import { genericNextHandler } from "../generic/generic-next-handler";

export async function nextPageHandler(ctx: MenuContext) {
    const { currentVoices, currentVoicesOffset } = ctx.session;

    await genericNextHandler(ctx, {
        menuElements: currentVoices,
        currentOffset: currentVoicesOffset,
        elementsPerPage: MAX_MENU_ELEMENTS_PER_PAGE,
        offsetUpdate: (newOffset) =>
            (ctx.session.currentVoicesOffset = newOffset),
    });
}
