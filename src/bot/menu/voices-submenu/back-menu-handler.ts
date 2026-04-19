import type { MenuContext } from "../../context";
import { genericBackHandler } from "../generic/generic-back-handler";

export async function backMenuHandler(ctx: MenuContext) {
    await genericBackHandler(ctx, (ctx) => {
        ctx.session.currentVoice = null;
    });
}
