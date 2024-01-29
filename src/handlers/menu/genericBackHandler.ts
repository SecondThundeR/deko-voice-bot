import type { BotContext, MenuBotContext } from "@/src/types/bot.ts";

type OnBackCallback = (ctx: BotContext) => void;

export function genericBackHandler(
    ctx: MenuBotContext,
    onBack?: OnBackCallback,
) {
    ctx.menu.back();
    onBack?.(ctx);
}
