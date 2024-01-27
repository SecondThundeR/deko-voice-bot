import { maxMenuElementsPerPage } from "@/src/constants/inline.ts";

import { genericPrevHandler } from "@/src/handlers/menu/genericPrevHandler.ts";

import type { MenuBotContext } from "@/src/types/bot.ts";

export async function prevPageHandler(ctx: MenuBotContext) {
    const { currentVoicesOffset } = ctx.session;

    await genericPrevHandler(ctx, {
        currentOffset: currentVoicesOffset,
        elementsPerPage: maxMenuElementsPerPage,
        offsetUpdate: (newOffset) =>
            ctx.session.currentVoicesOffset = newOffset,
    });
}
