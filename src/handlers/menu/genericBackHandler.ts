import type { BotContext, MenuBotContext } from "@/src/types/bot.ts";

type OnBackCallback = (ctx: BotContext) => void;

export function genericBackHandler(
    ctx: MenuBotContext,
    onBack?: OnBackCallback,
    deleteMessage?: boolean,
) {
    if (!deleteMessage) {
        ctx.menu.back();
    } else {
        ctx.deleteMessage();
    }
    onBack?.(ctx);
}
