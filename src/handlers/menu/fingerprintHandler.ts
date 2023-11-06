import { BotContext } from "@/src/types/bot.ts";
import { getMenuIdentificator } from "@/src/helpers/menu.ts";

export function fingerprintHandler(ctx: BotContext) {
    return getMenuIdentificator(ctx);
}
