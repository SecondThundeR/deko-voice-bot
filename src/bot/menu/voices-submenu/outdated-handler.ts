import type { MenuContext } from "#root/bot/context.js";
import { genericOutdatedHandler } from "../generic/generic-outdated-handler.ts";

export function outdatedHandler(ctx: MenuContext) {
    return genericOutdatedHandler(ctx, {
        menuElement: ctx.session.currentVoice,
    });
}
