import type { MenuContext } from "@/bot/context";
import { genericOutdatedHandler } from "../generic/generic-outdated-handler";

export function outdatedHandler(ctx: MenuContext) {
    return genericOutdatedHandler(ctx, {
        menuElement: ctx.session.currentVoice,
    });
}
