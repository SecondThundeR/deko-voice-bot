import { maxMenuElementsPerPage } from "@/src/constants/inline.ts";

import { genericNextHandler } from "@/src/handlers/menu/genericNextHandler.ts";

import type { MenuBotContext } from "@/src/types/bot.ts";

export async function nextPageHandler(ctx: MenuBotContext) {
    const { currentVoices, currentVoicesOffset } = ctx.session;

    await genericNextHandler(ctx, {
        menuElements: currentVoices,
        currentOffset: currentVoicesOffset,
        elementsPerPage: maxMenuElementsPerPage,
        offsetUpdate: (newOffset) =>
            ctx.session.currentVoicesOffset = newOffset,
    });
}
