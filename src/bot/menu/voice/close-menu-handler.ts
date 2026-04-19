import type { Context } from "../../context";
import { genericCloseHandler } from "../generic/generic-close-handler";

export async function closeMenuHandler(ctx: Context) {
    await genericCloseHandler(ctx, (ctx) => {
        ctx.session.currentVoice = null;
    });
}
