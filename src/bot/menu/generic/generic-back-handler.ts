import type { CallbackWithContext, MenuContext } from "#root/bot/context.js";

export async function genericBackHandler(
    ctx: MenuContext,
    onBack?: CallbackWithContext,
    deleteMessage?: boolean,
) {
    if (deleteMessage) {
        await ctx.deleteMessage().catch(() => {});
    } else {
        ctx.menu.back();
    }

    onBack?.(ctx);
}
