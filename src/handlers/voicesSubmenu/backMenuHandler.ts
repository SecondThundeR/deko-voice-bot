import { genericBackHandler } from "@/src/handlers/menu/genericBackHandler.ts";

import type { MenuBotContext } from "@/src/types/bot.ts";

export function backMenuHandler(ctx: MenuBotContext) {
    genericBackHandler(ctx, (ctx) => {
        ctx.session.currentVoice = null;
    });
}
