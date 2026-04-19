import type { CallbackWithContext, MenuContext } from "../../context";

export async function genericBackHandler(
    ctx: MenuContext,
    onBack?: CallbackWithContext,
    deleteMessage?: boolean,
) {
    if (deleteMessage) {
        await ctx.deleteMessage();
    } else {
        ctx.menu.back();
    }

    onBack?.(ctx);
}
