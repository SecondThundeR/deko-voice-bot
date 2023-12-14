import { BotContext } from "@/src/types/bot.ts";
import { getMenuIdentificator } from "@/src/helpers/menu.ts";

export const fingerprintHandler = (ctx: BotContext) =>
    getMenuIdentificator(ctx);
