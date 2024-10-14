import type { CallbackWithContext, MenuBotContext } from "@/src/types/bot";

export async function genericBackHandler(
    ctx: MenuBotContext,
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
