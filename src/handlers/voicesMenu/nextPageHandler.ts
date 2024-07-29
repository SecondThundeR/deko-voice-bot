import { maxMenuElementsPerPage } from "@/src/constants/inline";

import { genericNextHandler } from "@/src/handlers/menu/genericNextHandler";

import type { MenuBotContext } from "@/src/types/bot";

export async function nextPageHandler(ctx: MenuBotContext) {
    const { currentVoices, currentVoicesOffset } = ctx.session;

    await genericNextHandler(ctx, {
        menuElements: currentVoices,
        currentOffset: currentVoicesOffset,
        elementsPerPage: maxMenuElementsPerPage,
        offsetUpdate: (newOffset) =>
            (ctx.session.currentVoicesOffset = newOffset),
    });
}
