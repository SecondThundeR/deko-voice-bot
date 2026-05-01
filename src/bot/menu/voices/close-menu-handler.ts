import type { Context } from "../../context";
import { genericCloseHandler } from "../generic/generic-close-handler";

export function closeMenuHandler(ctx: Context) {
    return genericCloseHandler(ctx, (ctx) => {
        ctx.session.currentVoicesOffset = 0;
    });
}
