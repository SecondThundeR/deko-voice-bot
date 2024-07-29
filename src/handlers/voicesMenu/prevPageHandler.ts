import { maxMenuElementsPerPage } from "@/src/constants/inline";

import { genericPrevHandler } from "@/src/handlers/menu/genericPrevHandler";

import type { MenuBotContext } from "@/src/types/bot";

export async function prevPageHandler(ctx: MenuBotContext) {
    const { currentVoicesOffset } = ctx.session;

    await genericPrevHandler(ctx, {
        currentOffset: currentVoicesOffset,
        elementsPerPage: maxMenuElementsPerPage,
        offsetUpdate: (newOffset) =>
            (ctx.session.currentVoicesOffset = newOffset),
    });
}
