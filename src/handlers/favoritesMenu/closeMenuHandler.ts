import { genericCloseHandler } from "@/src/handlers/menu/genericCloseHandler.ts";

import type { BotContext } from "@/src/types/bot.ts";

export async function closeMenuHandler(ctx: BotContext) {
    await genericCloseHandler(ctx, (ctx) => {
        ctx.session.currentFavorites = null;
        ctx.session.currentFavoritesOffset = 0;
    });
}
