import { genericOutdatedHandler } from "@/src/handlers/menu/genericOutdatedHandler";

import type { MenuBotContext } from "@/src/types/bot";

export async function outdatedHandler(ctx: MenuBotContext) {
    await genericOutdatedHandler(ctx, {
        menuElement: ctx.session.currentVoices,
    });
}
