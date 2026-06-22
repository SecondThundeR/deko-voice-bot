import type { Context } from "#root/bot/context.js";
import { genericCloseHandler } from "../generic/generic-close-handler.ts";

export function closeMenuHandler(ctx: Context) {
    return genericCloseHandler(ctx, (ctx) => {
        ctx.session.currentVoice = null;
    });
}
