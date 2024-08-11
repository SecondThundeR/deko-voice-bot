import type { BotContext, MenuBotContext } from "@/src/types/bot";

export async function genericBackHandler(
    ctx: MenuBotContext,
    onBack?: (ctx: BotContext) => void,
    deleteMessage?: boolean,
) {
    if (deleteMessage) {
        await ctx.deleteMessage();
    } else {
        ctx.menu.back();
    }

    onBack?.(ctx);
}
