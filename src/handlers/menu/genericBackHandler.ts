import type { BotContext, MenuBotContext } from "@/src/types/bot";

export function genericBackHandler(
    ctx: MenuBotContext,
    onBack?: (ctx: BotContext) => void,
    deleteMessage?: boolean,
) {
    if (!deleteMessage) {
        ctx.menu.back();
    } else {
        ctx.deleteMessage();
    }

    onBack?.(ctx);
}
