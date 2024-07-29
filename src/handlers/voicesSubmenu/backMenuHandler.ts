import { genericBackHandler } from "@/src/handlers/menu/genericBackHandler";

import type { MenuBotContext } from "@/src/types/bot";

export function backMenuHandler(ctx: MenuBotContext) {
    genericBackHandler(ctx, (ctx) => {
        ctx.session.currentVoice = null;
    });
}
