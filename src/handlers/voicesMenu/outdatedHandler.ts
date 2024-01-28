import { genericOutdatedHandler } from "@/src/handlers/menu/genericOutdatedHandler.ts";

import type { MenuBotContext } from "@/src/types/bot.ts";

export async function outdatedHandler(ctx: MenuBotContext) {
    await genericOutdatedHandler(ctx, {
        menuElement: ctx.session.currentVoices,
    });
}
