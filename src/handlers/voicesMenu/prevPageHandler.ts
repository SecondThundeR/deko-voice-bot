import { MAX_MENU_ELEMENTS_PER_PAGE } from "@/src/constants/inline";

import { genericPrevHandler } from "@/src/handlers/menu/genericPrevHandler";

import type { MenuBotContext } from "@/src/types/bot";

export async function prevPageHandler(ctx: MenuBotContext) {
    const { currentVoicesOffset } = ctx.session;

    await genericPrevHandler(ctx, {
        currentOffset: currentVoicesOffset,
        elementsPerPage: MAX_MENU_ELEMENTS_PER_PAGE,
        offsetUpdate: (newOffset) =>
            (ctx.session.currentVoicesOffset = newOffset),
    });
}
