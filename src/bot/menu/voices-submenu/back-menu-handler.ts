import type { MenuContext } from "@/bot/context";
import { genericBackHandler } from "../generic/generic-back-handler";

export function backMenuHandler(ctx: MenuContext) {
    return genericBackHandler(ctx, (ctx) => {
        ctx.session.currentVoice = null;
    });
}
