import { genericBackHandler } from "@/src/handlers/menu/genericBackHandler";

import type { MenuBotContext } from "@/src/types/bot";

export async function backMenuHandler(ctx: MenuBotContext) {
    await genericBackHandler(ctx, (ctx) => {
        ctx.session.currentVoice = null;
    });
}
