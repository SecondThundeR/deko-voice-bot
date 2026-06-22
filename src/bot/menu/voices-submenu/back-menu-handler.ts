import type { MenuContext } from "#root/bot/context.js";
import { genericBackHandler } from "../generic/generic-back-handler.ts";

export function backMenuHandler(ctx: MenuContext) {
    return genericBackHandler(ctx, (ctx) => {
        ctx.session.currentVoice = null;
    });
}
